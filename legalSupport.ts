// Risorse legali per la difesa dal cyberbullismo

import type { LegalAction, LegalContact, SupportResource } from '@/types';

// Azioni legali disponibili
export const legalActions: LegalAction[] = [
  {
    id: 'immediate-takedown',
    title: 'Richiesta Rimozione Immediata',
    description: 'Richiedi la rimozione immediata del contenuto alle piattaforme social',
    applicableIn: ['Italia', 'UE', 'USA'],
    urgency: 'immediate',
    steps: [
      'Documenta tutto con screenshot e URL',
      'Usa la funzione "Segnala" sulla piattaforma',
      'Compila il modulo di violazione dei termini',
      'Specifica che si tratta di cyberbullismo',
      'Richiedi la notifica di azione intrapresa'
    ],
    contacts: [
      {
        name: 'Meta Help Center',
        type: 'platform',
        website: 'https://help.instagram.com/contact/723586364339719',
        description: 'Segnalazione contenuti Instagram/Facebook'
      },
      {
        name: 'TikTok Safety',
        type: 'platform',
        website: 'https://www.tiktok.com/safety/en/online-safety/cyberbullying/',
        description: 'Centro sicurezza TikTok'
      },
      {
        name: 'Twitter/X Support',
        type: 'platform',
        website: 'https://help.twitter.com/forms/abusivebehavior',
        description: 'Segnalazione comportamento abusivo'
      }
    ]
  },
  {
    id: 'police-report',
    title: 'Denuncia alle Forze dell\'Ordine',
    description: 'Sportello denuncia per cyberbullismo e diffamazione online',
    applicableIn: ['Italia'],
    urgency: '24h',
    steps: [
      'Raccogli tutte le prove (screenshot, URL, date)',
      'Vai in commissariato o usa la denuncia online',
      'Spiega la situazione con calma e precisione',
      'Richiedi il numero di protocollo',
      'Segui l\'evoluzione dell\'indagine'
    ],
    contacts: [
      {
        name: 'Polizia Postale',
        type: 'police',
        phone: '117',
        website: 'https://www.commissariatodips.it',
        description: 'Specializzati in reati informatici'
      },
      {
        name: 'Carabinieri',
        type: 'police',
        phone: '112',
        website: 'https://www.carabinieri.it',
        description: 'Denuncia anche online via app'
      }
    ]
  },
  {
    id: 'gdpr-request',
    title: 'Richiesta GDPR (Diritto all\'Oblio)',
    description: 'Richiedi la cancellazione dei dati personali ai sensi del GDPR',
    applicableIn: ['Italia', 'UE'],
    urgency: '72h',
    steps: [
      'Identifica il titolare del trattamento',
      'Redigi una richiesta formale di cancellazione',
      'Cita l\'art. 17 GDPR (diritto alla cancellazione)',
      'Invia via PEC per ricevuta di ritorno',
      'Attendi 30 giorni per la risposta'
    ],
    contacts: [
      {
        name: 'Garante Privacy',
        type: 'organization',
        phone: '06 696771',
        email: 'garante@gpdp.it',
        website: 'https://www.garanteprivacy.it',
        description: 'Autorità di controllo privacy italiana'
      }
    ]
  },
  {
    id: 'legal-action-minors',
    title: 'Tutela Legale per Minori',
    description: 'Azioni specifiche per proteggere minori vittime di cyberbullismo',
    applicableIn: ['Italia'],
    urgency: 'immediate',
    steps: [
      'Contatta immediatamente la scuola',
      'Segnala al coordinatore antbullismo',
      'Richiedi convocazione del team di supporto',
      'Valuta denuncia presso Tribunale per i Minorenni',
      'Attiva supporto psicologico specializzato'
    ],
    contacts: [
      {
        name: 'Telefono Azzurro',
        type: 'helpline',
        phone: '1.96.96',
        email: 'azzurro@telefonoazzurro.it',
        website: 'https://www.telefonoazzurro.it',
        hours: '24/7',
        description: 'Prima linea di aiuto per minori'
      },
      {
        name: 'Safer Internet Center',
        type: 'organization',
        phone: '06 4201 6297',
        email: 'info@saferinternet.it',
        website: 'https://www.saferinternet.it',
        description: 'Centro per la sicurezza online dei minori'
      }
    ]
  },
  {
    id: 'defamation-lawsuit',
    title: 'Querela per Diffamazione',
    description: 'Azione legale per diffamazione aggravata da mezzo telematico',
    applicableIn: ['Italia'],
    urgency: '72h',
    steps: [
      'Consulta un avvocato specializzato',
      'Raccogli tutte le prove del danno',
      'Valuta il tipo di querela (penale/civile)',
      'Presenta querela entro 3 mesi dal fatto',
      'Richiedi il risarcimento del danno'
    ],
    contacts: [
      {
        name: 'Ordine degli Avvocati',
        type: 'organization',
        website: 'https://www.ordineavvocati.it',
        description: 'Trova un avvocato nella tua città'
      },
      {
        name: 'Corte di Cassazione - Penale',
        type: 'organization',
        website: 'https://www.cortedicassazione.it',
        description: 'Informazioni su reati di diffamazione'
      }
    ]
  },
  {
    id: 'image-removal',
    title: 'Rimozione Immagini Non Autorizzate',
    description: 'Procedura per rimozione immagini personali usate senza consenso',
    applicableIn: ['Italia', 'UE', 'USA'],
    urgency: 'immediate',
    steps: [
      'Verifica i diritti d\'autore sull\'immagine',
      'Invia DMCA takedown notice (USA)',
      'Richiedi rimozione per violazione privacy (UE)',
      'Contatta l\'hosting provider direttamente',
      'Valuta azione legale per danni'
    ],
    contacts: [
      {
        name: 'Google Legal Support',
        type: 'platform',
        website: 'https://support.google.com/legal',
        description: 'Richiesta rimozione contenuti Google'
      },
      {
        name: 'Bing Content Removal',
        type: 'platform',
        website: 'https://www.bing.com/webmaster/tools/content-removal',
        description: 'Richiesta rimozione da Bing'
      }
    ]
  }
];

// Contatti di emergenza
export const emergencyContacts: LegalContact[] = [
  {
    name: 'Telefono Azzurro',
    type: 'helpline',
    phone: '1.96.96',
    email: 'azzurro@telefonoazzurro.it',
    website: 'https://www.telefonoazzurro.it',
    hours: '24/7',
    description: 'Supporto immediato per minori in difficoltà'
  },
  {
    name: 'Polizia Postale',
    type: 'police',
    phone: '117',
    website: 'https://www.commissariatodips.it',
    hours: '24/7',
    description: 'Reati informatici e cyberbullismo'
  },
  {
    name: 'Carabinieri',
    type: 'police',
    phone: '112',
    website: 'https://www.carabinieri.it',
    hours: '24/7',
    description: 'Emergenze e denunce'
  },
  {
    name: 'Samaritans - Telefono Amico',
    type: 'helpline',
    phone: '800 86 00 22',
    email: 'samaritans@telefonoamico.it',
    website: 'https://www.telefonoamico.it',
    hours: '24/7',
    description: 'Supporto emotivo per chi soffre'
  }
];

// Risorse di supporto
export const supportResources: SupportResource[] = [
  {
    id: 'minor-guide',
    category: 'minor',
    title: 'Guida per Ragazzi',
    description: 'Cosa fare se sei vittima di cyberbullismo',
    content: `
## Se sei vittima di cyberbullismo:

### 1. NON RISPONDERE
Non rispondere ai messaggi o alle provocazioni. Chi bullizza cerca una reazione.

### 2. DOCUMENTA TUTTO
- Fai screenshot di tutto
- Salva URL, date e orari
- Annota i nomi degli account

### 3. PARLA CON QUALCUNO
- Genitori, insegnanti, amici di fiducia
- Non tenerti tutto dentro
- Chiedi aiuto, non sei solo

### 4. BLOCCA E SEGNALA
- Blocca chi ti molesta
- Segnala alla piattaforma
- Usa la funzione "report"

### 5. RICORDA
- Non è colpa tua
- Non sei solo/a
- Chiedere aiuto è forte, non debole
    `,
    checklist: [
      'Ho fatto screenshot di tutto',
      'Ho bloccato l\'account che mi bullizzava',
      'Ho segnalato il contenuto',
      'Ho parlato con un adulto di fiducia',
      'Ho salvato tutte le prove'
    ]
  },
  {
    id: 'parent-guide',
    category: 'parent',
    title: 'Guida per Genitori',
    description: 'Come aiutare tuo figlio/a in caso di cyberbullismo',
    content: `
## Se tuo figlio/a è vittima di cyberbullismo:

### 1. ASCOLTA SENZA GIUDICARE
- Crea un ambiente sicuro per parlare
- Non accusare o minimizzare
- Mostra empatia e comprensione

### 2. DOCUMENTA L'EVIDENZA
- Aiuta a raccogliere prove
- Salva screenshot con data e ora
- Crea una timeline degli eventi

### 3. AGISCI PRONTAMENTE
- Contatta la scuola
- Valuta la denuncia alle autorità
- Consulta un legale se necessario

### 4. SUPPORTO PSICOLOGICO
- Non sottovalutare l'impatto emotivo
- Valuta il supporto di uno psicologo
- Monitora il benessere del tuo figlio

### 5. PREVENZIONE FUTURA
- Parla di sicurezza online
- Imposta controlli parentali
- Monitora l'uso dei social (con rispetto)
    `,
    checklist: [
      'Ho ascoltato mio figlio/a senza giudicare',
      'Ho raccolto tutte le prove',
      'Ho contattato la scuola',
      'Ho valutato la denuncia',
      'Ho cercato supporto psicologico',
      'Ho parlato di sicurezza online'
    ]
  },
  {
    id: 'educator-guide',
    category: 'educator',
    title: 'Guida per Educatori',
    description: 'Come gestire il cyberbullismo a scuola',
    content: `
## Protocollo scolastico per il cyberbullismo:

### 1. RICEZIONE SEGNALAZIONE
- Ascolta l'alunno con attenzione
- Raccogli tutte le informazioni
- Non promettere segretezza assoluta

### 2. DOCUMENTAZIONE
- Compila il registro delle segnalazioni
- Raccogli prove (screenshot, URL)
- Identifica eventuali testimoni

### 3. ATTIVAZIONE TEAM ANTIBULLISMO
- Convoca il team di supporto
- Valuta la gravità della situazione
- Pianifica interventi

### 4. COINVOLGIMENTO FAMIGLIE
- Contatta i genitori della vittima
- Contatta i genitori dei responsabili
- Organizza incontri di mediazione

### 5. SEGUITO
- Monitora la situazione nel tempo
- Valuta interventi educativi
- Coinvolgi esperti esterni se necessario
    `,
    checklist: [
      'Ho documentato la segnalazione',
      'Ho attivato il team antibullismo',
      'Ho contattato le famiglie coinvolte',
      'Ho pianificato interventi educativi',
      'Ho monitorato la situazione'
    ]
  },
  {
    id: 'victim-rights',
    category: 'victim',
    title: 'I Tuoi Diritti',
    description: 'Conosci i tuoi diritti come vittima di cyberbullismo',
    content: `
## I tuoi diritti fondamentali:

### DIRITTO ALLA RIMOZIONE
Hai il diritto di richiedere la rimozione immediata di contenuti che ti danneggiano.

### DIRITTO ALLA PRIVACY
I tuoi dati personali sono protetti dal GDPR. Puoi richiedere la loro cancellazione.

### DIRITTO ALLA DIFESA
Puoi denunciare chi ti bullizza alle autorità competenti.

### DIRITTO AL RISARCIMENTO
Se hai subito danni, puoi richiedere un risarcimento.

### DIRITTO ALL'ANONIMATO
Nei procedimenti penali, il minore ha diritto all'anonimato.

## Normativa di riferimento:
- Legge 71/2017 (cyberbullismo)
- Art. 612-bis CP (diffamazione)
- Art. 595 CP (ingiuria)
- GDPR 2016/679 (protezione dati)
    `,
    contacts: [
      {
        name: 'Garante Infanzia',
        type: 'organization',
        phone: '06 6779 1',
        website: 'https://www.garanteinfanzia.org'
      }
    ]
  }
];

// Ottieni azioni legali per paese
export function getLegalActionsByCountry(country: string): LegalAction[] {
  return legalActions.filter(action => action.applicableIn.includes(country));
}

// Ottieni risorse per categoria
export function getResourcesByCategory(category: 'minor' | 'parent' | 'educator' | 'victim'): SupportResource[] {
  return supportResources.filter(resource => resource.category === category);
}
