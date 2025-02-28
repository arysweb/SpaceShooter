// Dialogue content
const onboardDialogues = [
    "AI: Good. You're aboard in one piece.",
    "Commander: What the hell just happened?",
    "AI: Emergency protocol. You were teleported.",
    "Commander: A little warning would've been nice.",
    "AI: No time. The Blaster's sensors show incoming hostiles.",
    "Commander: How long?",
    "AI: Too late. They're here! Hold them off while I bring systems online!"
];

class DialogueSystem {
    constructor(dialogues) {
        console.log('Dialogue System Initialized', dialogues);
        this.dialogues = dialogues;
        this.currentDialogueIndex = 0;
        this.isTyping = false;

        // Get DOM elements
        this.dialogueOverlay = document.getElementById('dialogue-overlay');
        this.dialogueText = document.getElementById('dialogue-text');
        this.continueBTN = document.getElementById('dialogue-continue');

        console.log('DOM Elements:', {
            dialogueOverlay: this.dialogueOverlay,
            dialogueText: this.dialogueText,
            continueBTN: this.continueBTN
        });

        // Initially hide the dialogue overlay completely
        if (this.dialogueOverlay) {
            this.dialogueOverlay.style.display = 'none';
            this.dialogueOverlay.style.opacity = '0';
            this.dialogueOverlay.style.visibility = 'hidden';
        }

        // Bind events
        if (this.continueBTN) {
            this.continueBTN.addEventListener('click', () => this.nextDialogue());
        }
    }

    start() {
        console.log('Dialogue System Started');
        
        // Show dialogue overlay with a slight delay
        if (this.dialogueOverlay) {
            // First, make it visible but fully transparent
            this.dialogueOverlay.style.display = 'block';
            this.dialogueOverlay.style.opacity = '0';
            this.dialogueOverlay.style.visibility = 'visible';

            // Fade in the dialogue overlay after a short delay
            setTimeout(() => {
                this.dialogueOverlay.style.opacity = '1';
                this.dialogueOverlay.classList.add('active');
            }, 200);  // Slight delay to create a smoother appearance
        }

        // Start typing the first dialogue
        this.typeDialogue(this.dialogues[0]);
    }

    typeDialogue(text) {
        console.log('Typing dialogue:', text);
        // Reset previous state
        if (this.dialogueText) {
            this.dialogueText.innerHTML = '';
        }
        if (this.continueBTN) {
            this.continueBTN.classList.add('hidden');
        }
        this.isTyping = true;

        let index = 0;
        const typeInterval = setInterval(() => {
            if (index < text.length) {
                if (this.dialogueText) {
                    this.dialogueText.innerHTML += text.charAt(index);
                }
                index++;
            } else {
                clearInterval(typeInterval);
                this.isTyping = false;
                if (this.continueBTN) {
                    this.continueBTN.classList.remove('hidden');
                }
            }
        }, 30); // Adjust speed as needed
    }

    nextDialogue() {
        // Prevent multiple clicks during typing
        if (this.isTyping) return;

        this.currentDialogueIndex++;

        // Check if dialogues are finished
        if (this.currentDialogueIndex >= this.dialogues.length) {
            this.end();
            return;
        }

        // Type next dialogue
        this.typeDialogue(this.dialogues[this.currentDialogueIndex]);
    }

    end() {
        console.log('Dialogue System Ended');
        if (this.dialogueOverlay) {
            this.dialogueOverlay.classList.remove('active');
            this.dialogueOverlay.style.display = 'none';
        }
        
        // Optional: Trigger game start or next phase
        if (window.gameState) {
            window.gameState.canSpawn = true;
            window.gameState.canShoot = true;
        }
    }
}

// Initialize dialogue system when fade-in is complete
document.addEventListener('DOMContentLoaded', () => {
    const fadeOverlay = document.getElementById('fade-overlay');
    const dialogueSystem = new DialogueSystem(onboardDialogues);

    // Create a MutationObserver to watch for opacity changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const opacity = window.getComputedStyle(fadeOverlay).opacity;
                console.log('Fade overlay computed opacity:', opacity);
                
                // Start dialogue exactly when overlay becomes fully transparent
                if (parseFloat(opacity) === 0) {
                    console.log('Fade animation complete, starting dialogue immediately');
                    dialogueSystem.start();
                    observer.disconnect(); // Stop observing after starting dialogue
                }
            }
        });
    });

    // Configure the observer
    observer.observe(fadeOverlay, { 
        attributes: true, 
        attributeFilter: ['style'] 
    });
});
