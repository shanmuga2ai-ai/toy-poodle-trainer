document.addEventListener('DOMContentLoaded', () => {
    const poodleContainer = document.getElementById('poodle-container');
    const poodleVideo = document.getElementById('poodle-video');
    const speechBubble = document.getElementById('speech-bubble');
    const statusIndicator = document.getElementById('status-indicator');
    const micBtn = document.getElementById('mic-btn');
    const barkAudio = document.getElementById('bark-audio');
    const buttons = document.querySelectorAll('.control-btn[data-command]');

    let isListening = false;
    let recognition;
    let currentState = 'idle';

    // Image/Video Assets - using poster as fallback for all states
    const images = {
        idle: 'assets/poodle-stand.png',
        sit: 'assets/poodle-sit.png',
        jump: 'assets/poodle-jump.png',
        stay: 'assets/poodle-stand.png',
        come: 'assets/poodle-come.png',
        move: 'assets/poodle-left.png',
        'go-back': 'assets/poodle-go-back.png'
    };

    const videos = {
        idle: 'assets/idle.mp4',
        sit: 'assets/sit.mp4',
        jump: 'assets/jump.mp4',
        stay: 'assets/stay.mp4',
        come: 'assets/come.mp4',
        move: 'assets/move.mp4'
    };

    // Try to load idle video, fallback to image
    loadMedia('idle');

    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.lang = 'en-US';
        recognition.interimResults = false;

        recognition.onstart = () => {
            isListening = true;
            updateMicStatus();
            statusIndicator.classList.add('active');
            statusIndicator.textContent = "Listening...";
        };

        recognition.onend = () => {
            if (isListening) {
                recognition.start();
            } else {
                statusIndicator.classList.remove('active');
                statusIndicator.textContent = "Paused";
            }
        };

        recognition.onresult = (event) => {
            const lastResult = event.results[event.results.length - 1];
            const command = lastResult[0].transcript.trim().toLowerCase();
            console.log('Voice Command:', command);
            processCommand(command);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            statusIndicator.textContent = "Error: " + event.error;
        };
    } else {
        alert("Web Speech API is not supported in this browser.");
        micBtn.style.display = 'none';
    }

    function processCommand(command) {
        if (command.includes('sit')) executeCommand('sit');
        else if (command.includes('jump') || command.includes('up')) executeCommand('jump');
        else if (command.includes('stay') || command.includes('wait')) executeCommand('stay');
        else if (command.includes('come') || command.includes('here')) executeCommand('come');
        else if (command.includes('left')) executeCommand('move-left');
        else if (command.includes('right')) executeCommand('move-right');
        else if (command.includes('bark') || command.includes('speak')) executeCommand('bark');
        else if (command.includes('back') || command.includes('return')) executeCommand('go-back');
    }

    function executeCommand(action) {
        console.log('Executing:', action);

        // Highlight the active button - stays highlighted until next command
        buttons.forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`[data-command="${action}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            // Keep highlighted until next command (no timeout)
        }

        // Reset specific state classes
        poodleContainer.classList.remove('sit', 'jump', 'bark', 'stay');

        // Reset position to center for all commands except left/right movement
        if (action !== 'move-left' && action !== 'move-right') {
            poodleContainer.classList.remove('move-left', 'move-right');
        }

        // Force reflow
        void poodleContainer.offsetWidth;

        switch (action) {
            case 'sit':
                loadMedia('sit');
                poodleContainer.classList.add('sit');
                currentState = 'sit';
                break;
            case 'jump':
                loadMedia('jump');
                poodleContainer.classList.add('jump');
                currentState = 'jump';
                // Keep jump image visible (removed auto-reset to idle)
                break;
            case 'move-left':
                loadMedia('move');
                poodleContainer.classList.remove('move-right');
                poodleContainer.classList.add('move-left');
                currentState = 'move';
                break;
            case 'move-right':
                loadMedia('move');
                poodleContainer.classList.remove('move-left');
                poodleContainer.classList.add('move-right');
                currentState = 'move';
                break;
            case 'come':
                loadMedia('come');
                currentState = 'come';
                break;
            case 'stay':
                loadMedia('stay');
                poodleContainer.classList.add('stay');
                currentState = 'stay';
                break;
            case 'go-back':
                poodleContainer.className = 'poodle-container';
                loadMedia('go-back');
                currentState = 'go-back';
                break;
            case 'bark':
                poodleContainer.classList.add('bark');
                showSpeechBubble("Yip yip!");
                playBarkSound();
                setTimeout(() => poodleContainer.classList.remove('bark'), 500);
                break;
        }
    }

    function loadMedia(state) {
        const videoSrc = videos[state];
        const imageSrc = images[state];

        // Try video first
        if (videoSrc && poodleVideo.src.indexOf(videoSrc) === -1) {
            poodleVideo.src = videoSrc;
            poodleVideo.poster = imageSrc; // Set poster as fallback
            poodleVideo.load();

            const playPromise = poodleVideo.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log(`Video for ${state} not found. Using image.`);
                    // Video failed, poster will show
                });
            }
        } else if (imageSrc) {
            // Just update poster if video source is same or no video
            poodleVideo.poster = imageSrc;
        }
    }

    function playBarkSound() {
        // Try to play audio file first
        barkAudio.currentTime = 0;
        barkAudio.play().catch(e => {
            console.log("Audio file missing or blocked. Using TTS fallback.");
            // Fallback to text-to-speech with higher pitch for toy poodle
            const utterance = new SpeechSynthesisUtterance("Yip yip!");
            utterance.pitch = 1.8; // Higher pitch for small dog
            utterance.rate = 1.3; // Faster for excitement
            utterance.volume = 0.8;
            window.speechSynthesis.speak(utterance);
        });
    }

    function showSpeechBubble(text) {
        speechBubble.textContent = text;
        speechBubble.classList.add('show');
        setTimeout(() => {
            speechBubble.classList.remove('show');
        }, 1000);
    }

    function updateMicStatus() {
        if (isListening) {
            micBtn.classList.add('listening');
        } else {
            micBtn.classList.remove('listening');
        }
    }

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const command = btn.getAttribute('data-command');
            executeCommand(command);
        });
    });

    micBtn.addEventListener('click', () => {
        if (isListening) {
            isListening = false;
            recognition.stop();
            updateMicStatus();
        } else {
            recognition.start();
        }
    });
});
