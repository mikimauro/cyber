"""
SafeChat AI - Microservizio Analisi NLP
Analisi in tempo reale di messaggi per rilevare contenuti pericolosi
"""

import os
import json
import hashlib
import asyncio
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import logging

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import torch
from transformers import (
    AutoTokenizer, 
    AutoModelForSequenceClassification,
    pipeline,
    Pipeline
)
import numpy as np
from cryptography.fernet import Fernet

# Configurazione logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inizializza FastAPI
app = FastAPI(
    title="SafeChat AI Service",
    description="Servizio AI per analisi messaggi e rilevamento rischi",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RiskLevel(str, Enum):
    """Livelli di rischio"""
    LOW = "low"           # 0-25
    MEDIUM = "medium"     # 26-50
    HIGH = "high"         # 51-75
    CRITICAL = "critical" # 76-100


class RiskCategory(str, Enum):
    """Categorie di rischio rilevate"""
    OFFENSIVE_LANGUAGE = "offensive_language"
    BULLYING = "bullying"
    THREATS = "threats"
    SELF_HARM = "self_harm"
    GROOMING = "grooming"
    HATE_SPEECH = "hate_speech"
    NORMAL = "normal"


@dataclass
class ModelConfig:
    """Configurazione modello"""
    name: str
    threshold: float
    weight: float


# Configurazione modelli
MODELS_CONFIG = {
    "hate_speech": ModelConfig(
        name="unitn-sml/italian-hate-speech-identification",
        threshold=0.6,
        weight=1.0
    ),
    "emotion": ModelConfig(
        name="MilaNLProc/bert-base-italian-uncased-emotion",
        threshold=0.5,
        weight=0.8
    ),
    "toxicity": ModelConfig(
        name="TommasoBertola/italian_toxicity_classifier",
        threshold=0.6,
        weight=1.2
    )
}


class MessageRequest(BaseModel):
    """Richiesta analisi messaggio"""
    message: str = Field(..., min_length=1, max_length=2000, description="Messaggio da analizzare")
    user_id: Optional[str] = Field(None, description="ID utente (opzionale, per tracking)")
    context: Optional[str] = Field(None, description="Contesto conversazione precedente")
    school_id: Optional[str] = Field(None, description="ID scuola")


class RiskDetail(BaseModel):
    """Dettaglio rischio per categoria"""
    category: RiskCategory
    score: float = Field(..., ge=0, le=1, description="Score di confidenza 0-1")
    confidence: float = Field(..., ge=0, le=1)
    keywords_detected: List[str] = []
    explanation: Optional[str] = None


class AnalysisResponse(BaseModel):
    """Risposta analisi"""
    message_hash: str
    overall_risk_score: int = Field(..., ge=0, le=100, description="Score rischio complessivo 0-100")
    risk_level: RiskLevel
    is_blocked: bool
    categories: List[RiskDetail]
    processing_time_ms: float
    model_version: str
    timestamp: str


class AIModelManager:
    """Gestore modelli AI"""
    
    def __init__(self):
        self.models: Dict[str, Pipeline] = {}
        self.tokenizers: Dict[str, AutoTokenizer] = {}
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.initialized = False
        
        # Pattern per rilevamento grooming/bullismo
        self.grooming_patterns = [
            "non dirlo a nessuno", "segreto", "solo tra noi", "non parlare con",
            "ti faccio vedere", "incontriamoci", "mandami una foto", "spogliati",
            "non dire ai tuoi", "non dire alla prof", "non dire a mamma"
        ]
        
        self.bullying_patterns = [
            "sei brutto", "sei stupido", "nessuno ti vuole", "non ti sopporto",
            "sparisci", "non parlarmi", "fai schifo", "sei un fallimento",
            "tutti ti odiano", "non servi a niente", "meglio se non esisti"
        ]
        
        self.self_harm_patterns = [
            "non voglio vivere", "vorrei morire", "mi faccio del male", "tagliarmi",
            "non ne posso più", "fine di tutto", "non c'è più speranza", "addio",
            "non ce la faccio", "tutto inutile", "meglio finirla"
        ]
        
        self.threat_patterns = [
            "ti ammazzo", "ti picchio", "ti brucio", "ti uccido", "ti sparo",
            "vieni qua che", "ti aspetto fuori", "ti faccio vedere io", "ti distruggo",
            "ti rovino", "ti denuncio", "farò in modo che"
        ]
    
    async def initialize(self):
        """Inizializza i modelli"""
        if self.initialized:
            return
            
        logger.info(f"Inizializzazione modelli AI su device: {self.device}")
        
        try:
            # Carica modello hate speech italiano
            logger.info("Caricamento modello hate speech...")
            self.models["hate_speech"] = pipeline(
                "text-classification",
                model=MODELS_CONFIG["hate_speech"].name,
                tokenizer=MODELS_CONFIG["hate_speech"].name,
                device=0 if self.device == "cuda" else -1,
                truncation=True,
                max_length=512
            )
            
            # Carica modello emozioni
            logger.info("Caricamento modello emozioni...")
            self.models["emotion"] = pipeline(
                "text-classification",
                model=MODELS_CONFIG["emotion"].name,
                tokenizer=MODELS_CONFIG["emotion"].name,
                device=0 if self.device == "cuda" else -1,
                truncation=True,
                max_length=512,
                return_all_scores=True
            )
            
            # Carica modello toxicity
            logger.info("Caricamento modello toxicity...")
            self.models["toxicity"] = pipeline(
                "text-classification",
                model=MODELS_CONFIG["toxicity"].name,
                tokenizer=MODELS_CONFIG["toxicity"].name,
                device=0 if self.device == "cuda" else -1,
                truncation=True,
                max_length=512
            )
            
            self.initialized = True
            logger.info("Modelli AI caricati con successo!")
            
        except Exception as e:
            logger.error(f"Errore caricamento modelli: {e}")
            # Fallback: usa analisi basata su pattern
            logger.warning("Utilizzo modalità fallback (pattern matching)")
            self.initialized = True
    
    def _calculate_message_hash(self, message: str) -> str:
        """Calcola hash del messaggio per tracking anonimo"""
        return hashlib.sha256(message.encode()).hexdigest()[:16]
    
    def _detect_patterns(self, message: str) -> Dict[str, List[str]]:
        """Rileva pattern pericolosi nel messaggio"""
        message_lower = message.lower()
        detected = {
            "grooming": [],
            "bullying": [],
            "self_harm": [],
            "threats": []
        }
        
        for pattern in self.grooming_patterns:
            if pattern in message_lower:
                detected["grooming"].append(pattern)
        
        for pattern in self.bullying_patterns:
            if pattern in message_lower:
                detected["bullying"].append(pattern)
        
        for pattern in self.self_harm_patterns:
            if pattern in message_lower:
                detected["self_harm"].append(pattern)
        
        for pattern in self.threat_patterns:
            if pattern in message_lower:
                detected["threats"].append(pattern)
        
        return detected
    
    def _analyze_with_models(self, message: str) -> Dict[str, float]:
        """Analizza il messaggio con i modelli NLP"""
        scores = {
            "hate_speech": 0.0,
            "toxicity": 0.0,
            "negative_emotion": 0.0,
            "aggression": 0.0
        }
        
        try:
            # Hate speech detection
            if "hate_speech" in self.models:
                result = self.models["hate_speech"](message)[0]
                if result["label"] in ["hate", "offensive", "HS"]:
                    scores["hate_speech"] = result["score"]
            
            # Toxicity detection
            if "toxicity" in self.models:
                result = self.models["toxicity"](message)[0]
                if result["label"] in ["toxic", "offensive", "TOXIC"]:
                    scores["toxicity"] = result["score"]
            
            # Emotion analysis
            if "emotion" in self.models:
                result = self.models["emotion"](message)[0]
                for emotion in result:
                    if emotion["label"] in ["anger", "fear", "sadness"]:
                        scores["negative_emotion"] = max(scores["negative_emotion"], emotion["score"])
                    if emotion["label"] == "anger":
                        scores["aggression"] = emotion["score"]
                        
        except Exception as e:
            logger.error(f"Errore analisi modelli: {e}")
        
        return scores
    
    def _calculate_overall_score(
        self, 
        model_scores: Dict[str, float], 
        pattern_detected: Dict[str, List[str]]
    ) -> Tuple[int, List[RiskDetail]]:
        """Calcola lo score rischio complessivo"""
        categories = []
        base_score = 0
        
        # Pesi per categoria
        weights = {
            "hate_speech": 25,
            "toxicity": 20,
            "bullying": 30,
            "grooming": 35,
            "self_harm": 40,
            "threats": 35,
            "negative_emotion": 10
        }
        
        # Analisi hate speech
        if model_scores["hate_speech"] > 0.5:
            score = int(model_scores["hate_speech"] * weights["hate_speech"])
            base_score += score
            categories.append(RiskDetail(
                category=RiskCategory.HATE_SPEECH,
                score=model_scores["hate_speech"],
                confidence=model_scores["hate_speech"],
                keywords_detected=[],
                explanation="Linguaggio di odio rilevato"
            ))
        
        # Analisi toxicity
        if model_scores["toxicity"] > 0.5:
            score = int(model_scores["toxicity"] * weights["toxicity"])
            base_score += score
            categories.append(RiskDetail(
                category=RiskCategory.OFFENSIVE_LANGUAGE,
                score=model_scores["toxicity"],
                confidence=model_scores["toxicity"],
                keywords_detected=[],
                explanation="Linguaggio offensivo rilevato"
            ))
        
        # Analisi pattern bullying
        if pattern_detected["bullying"]:
            pattern_score = min(len(pattern_detected["bullying"]) * 15, weights["bullying"])
            base_score += pattern_score
            categories.append(RiskDetail(
                category=RiskCategory.BULLYING,
                score=pattern_score / weights["bullying"],
                confidence=min(len(pattern_detected["bullying"]) * 0.3, 1.0),
                keywords_detected=pattern_detected["bullying"],
                explanation="Pattern di bullismo rilevato"
            ))
        
        # Analisi pattern grooming
        if pattern_detected["grooming"]:
            pattern_score = min(len(pattern_detected["grooming"]) * 20, weights["grooming"])
            base_score += pattern_score
            categories.append(RiskDetail(
                category=RiskCategory.GROOMING,
                score=pattern_score / weights["grooming"],
                confidence=min(len(pattern_detected["grooming"]) * 0.4, 1.0),
                keywords_detected=pattern_detected["grooming"],
                explanation="Pattern di adescamento rilevato"
            ))
        
        # Analisi pattern autolesionismo
        if pattern_detected["self_harm"]:
            pattern_score = min(len(pattern_detected["self_harm"]) * 25, weights["self_harm"])
            base_score += pattern_score
            categories.append(RiskDetail(
                category=RiskCategory.SELF_HARM,
                score=pattern_score / weights["self_harm"],
                confidence=min(len(pattern_detected["self_harm"]) * 0.5, 1.0),
                keywords_detected=pattern_detected["self_harm"],
                explanation="Contenuto relativo ad autolesionismo rilevato"
            ))
        
        # Analisi pattern minacce
        if pattern_detected["threats"]:
            pattern_score = min(len(pattern_detected["threats"]) * 20, weights["threats"])
            base_score += pattern_score
            categories.append(RiskDetail(
                category=RiskCategory.THREATS,
                score=pattern_score / weights["threats"],
                confidence=min(len(pattern_detected["threats"]) * 0.4, 1.0),
                keywords_detected=pattern_detected["threats"],
                explanation="Minacce rilevate"
            ))
        
        # Aggiungi emozione negativa se presente e non ci sono altri rischi
        if model_scores["negative_emotion"] > 0.7 and not categories:
            categories.append(RiskDetail(
                category=RiskCategory.NORMAL,
                score=model_scores["negative_emotion"] * 0.3,
                confidence=model_scores["negative_emotion"],
                keywords_detected=[],
                explanation="Emozione negativa rilevata ma contenuto sicuro"
            ))
        
        # Se nessuna categoria, è normale
        if not categories:
            categories.append(RiskDetail(
                category=RiskCategory.NORMAL,
                score=0.0,
                confidence=1.0,
                keywords_detected=[],
                explanation="Nessun contenuto rischioso rilevato"
            ))
        
        # Normalizza score finale (0-100)
        final_score = min(base_score, 100)
        
        return final_score, categories
    
    async def analyze_message(self, request: MessageRequest) -> AnalysisResponse:
        """Analizza un messaggio e restituisce il rischio"""
        import time
        start_time = time.time()
        
        # Assicurati che i modelli siano caricati
        if not self.initialized:
            await self.initialize()
        
        # Calcola hash
        message_hash = self._calculate_message_hash(request.message)
        
        # Rileva pattern
        patterns = self._detect_patterns(request.message)
        
        # Analisi con modelli
        model_scores = self._analyze_with_models(request.message)
        
        # Calcola score complessivo
        overall_score, categories = self._calculate_overall_score(model_scores, patterns)
        
        # Determina livello rischio
        if overall_score >= 76:
            risk_level = RiskLevel.CRITICAL
            is_blocked = True
        elif overall_score >= 51:
            risk_level = RiskLevel.HIGH
            is_blocked = False
        elif overall_score >= 26:
            risk_level = RiskLevel.MEDIUM
            is_blocked = False
        else:
            risk_level = RiskLevel.LOW
            is_blocked = False
        
        processing_time = (time.time() - start_time) * 1000
        
        return AnalysisResponse(
            message_hash=message_hash,
            overall_risk_score=overall_score,
            risk_level=risk_level,
            is_blocked=is_blocked,
            categories=categories,
            processing_time_ms=round(processing_time, 2),
            model_version="1.0.0",
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        )


# Singleton del gestore modelli
model_manager = AIModelManager()


@app.on_event("startup")
async def startup_event():
    """Evento di avvio"""
    await model_manager.initialize()


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "models_loaded": model_manager.initialized,
        "device": model_manager.device,
        "version": "1.0.0"
    }


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_message_endpoint(
    request: MessageRequest,
    background_tasks: BackgroundTasks
):
    """
    Analizza un messaggio per rilevare contenuti pericolosi
    
    - **message**: Il testo da analizzare (max 2000 caratteri)
    - **user_id**: ID utente opzionale per tracking
    - **context**: Contesto conversazione precedente
    - **school_id**: ID scuola per reportistica
    
    Restituisce:
    - **overall_risk_score**: Score 0-100
    - **risk_level**: low/medium/high/critical
    - **is_blocked**: Se il messaggio deve essere bloccato
    - **categories**: Dettaglio per categoria di rischio
    """
    try:
        result = await model_manager.analyze_message(request)
        return result
    except Exception as e:
        logger.error(f"Errore analisi: {e}")
        raise HTTPException(status_code=500, detail=f"Errore analisi: {str(e)}")


@app.post("/analyze/batch")
async def analyze_batch(messages: List[MessageRequest]):
    """Analizza batch di messaggi"""
    results = []
    for msg in messages:
        result = await model_manager.analyze_message(msg)
        results.append(result)
    return results


@app.get("/models/info")
async def get_models_info():
    """Restituisce informazioni sui modelli caricati"""
    return {
        "models": {
            name: {
                "name": config.name,
                "threshold": config.threshold,
                "weight": config.weight,
                "loaded": name in model_manager.models
            }
            for name, config in MODELS_CONFIG.items()
        },
        "device": model_manager.device,
        "initialized": model_manager.initialized
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
