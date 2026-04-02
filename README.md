# Bot Telegram per l'Upload di File

Questo progetto è un bot Telegram progettato per ricevere file, caricarli su un servizio di file hosting esterno (Filebin.net) e restituire un link per il download.

Il bot è stato sviluppato in **TypeScript** e containerizzato con **Docker** per un facile deployment e una gestione pulita delle dipendenze. L'architettura utilizza un'istanza locale dell'API di Telegram per gestire i file in modo efficiente.

---

## ✨ Caratteristiche

- **Upload Semplice**: Invia un documento al bot e ricevi un link per condividerlo.
- **Link Brevi**: Integrazione con TinyURL per generare link compatti e facili da condividere.
- **Feedback Visivo**: Animazioni di progresso ("aesthetic") per download e upload, per un'esperienza utente moderna e reattiva.
- **Pulizia Automatica**: I file vengono eliminati dal server dopo l'upload per non occupare spazio.
- **Architettura Robusta**: Codice modulare, gestione centralizzata degli errori (`src/error`) e logging dettagliato (`src/logger`).
- **Containerizzato con Docker**: Pronto per il deployment su qualsiasi server con Docker, con una gestione ottimizzata delle risorse.

---

## 🚀 Prerequisiti

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)
- Un account Telegram e le credenziali `API_ID` e `API_HASH` (ottenibili da [my.telegram.org](https://my.telegram.org)).
- Un token per il bot (ottenibile parlando con [@BotFather](https://t.me/BotFather) su Telegram).
- (Opzionale) Una API Key per TinyURL se si desidera accorciare i link.

---

## ⚙️ Installazione e Avvio

1.  **Clonare il repository**

    ```bash
    git clone https://github.com/miketester10/upload-file-bot.git
    cd upload-file-bot
    ```

2.  **Configurare le variabili d'ambiente**
    Crea una copia del file di esempio `.env.example` e rinominala in `.env`.

    ```bash
    cp .env.example .env
    ```

    Ora modifica il file `.env` e inserisci le tue credenziali:

    ```ini
    # Credenziali per l'API di Telegram (ottenibili da my.telegram.org)
    API_ID=1234567
    API_HASH=abcdef1234567890abcdef1234567890

    # Token del bot Telegram (ottenibile da @BotFather)
    BOT_TOKEN=5625854050:GbNgyvIvskIVcr_Ub2dgdfNBNsdkNSD
    # ID Telegram del proprietario del bot (per bypassare il limite sulla dimensione dei file)
    BOT_OWNER_TELEGRAM_ID=12345678

    # Dimensione massima dei file accettati (in byte, 800MB = 800000000 bytes)
    MAX_FILE_SIZE_BYTES=800000000

    # URL del server API locale di Telegram (corrisponde al servizio Docker)
    LOCAL_BOT_API=http://TelegramLocalAPI:8081

    # TinyURL (per generare URL brevi)
    TINYURL_API_URL=https://api.tinyurl.com/create
    TINYURL_API_KEY=LaTuaChiaveTinyUrl
    ```

3.  **Creare la rete Docker**
    I servizi comunicano tramite una rete Docker esterna. Creala con questo comando:

    ```bash
    docker network create telegram-bot-network
    ```

4.  **Avviare i container**
    Avvia entrambi i servizi (l'API di Telegram e il bot) in background:
    ```bash
    docker compose -f docker-compose.telegram.yml up -d
    docker compose -f docker-compose.bot.yml up -d
    ```

A questo punto, il bot sarà online e pronto a ricevere file!

---

## 🛠️ Gestione dei Servizi

- **Vedere i log in tempo reale**:

  ```bash
  # Per il bot
  docker compose -f docker-compose.bot.yml logs -f

  # Per l'API di Telegram
  docker compose -f docker-compose.telegram.yml logs -f
  ```

- **Fermare i servizi**:
  ```bash
  docker compose -f docker-compose.bot.yml down
  docker compose -f docker-compose.telegram.yml down
  ```

---

## 📂 Struttura del Progetto

```
.
├── container_data/               # Volume montato da docker-compose.telegram.yml
├── src/                          # Codice sorgente del bot
│   ├── error/                    # Gestione centralizzata degli errori e classi personalizzate
│   ├── interfaces/               # Definizioni dei tipi e interfacce TS
│   ├── logger/                   # Configurazione del logger (Pino)
│   ├── types/                    # Definizioni dei tipi (es. ErrorContext)
│   ├── utility/                  # Funzioni di utilità
│   │   ├── animationController.ts # Gestione animazioni di progresso
│   │   ├── cleanupFile.ts        # Rimozione file locali
│   │   ├── downloadFile.ts       # Logica di download da Telegram Locale
│   │   ├── generateShortUrl.ts   # Integrazione con API TinyURL
│   │   ├── index.ts              # Barrel file per esportare le utility
│   │   ├── prepareFilePath.ts    # Gestione percorsi file scaricati
│   │   ├── renderProgressBar.ts  # Visualizzazione barra di caricamento
│   │   └── uploadFile.ts         # Logica di upload su Filebin
│   └── main.ts                   # Punto di ingresso del bot
├── .env.example                  # File di esempio per le variabili d'ambiente
├── docker-compose.bot.yml        # Definizione del servizio del bot
├── docker-compose.telegram.yml   # Definizione del servizio API di Telegram
├── package.json
└── tsconfig.json
```
