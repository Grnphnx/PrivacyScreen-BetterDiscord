/**
* This plugin is made for users that may have prying eyes.
* Use the Keybind Alt+Shift to activate the privacy screen.
* In the settings, there are multiple variables to adjust
* to make the privacy screen to your liking.
* The memes are meant to make the privacy screen seem you are not
* hiding anything. (Saves suspicion even if your not trying to be suspicious) 


 * @name PrivacyScreen
 * @version 1.9.3
 * @description Adds a privacy screen over the entire Discord window with customizable settings and an option to display a random meme from meme-api.com.
*/

module.exports = class PrivacyScreen {
    constructor() {
        this.privacyScreenEnabled = false;
        this.darkness = 0.8;
        this.opacity = 0.8;
        this.blur = 0.8;
        this.showImage = true;
        this.backgroundImageUrl = '';
        this.imageSize = 80; // Default size as a percentage
        this.memes = [];
        this.currentMemeIndex = 0;
        this.handleKeyPress = this.handleKeyPress.bind(this);
    }

    getName() { return "PrivacyScreen"; }
    getDescription() { return "Add a functional privacy screen to your Discord. Keybind Alt+Shift."; }
    getVersion() { return "1.0.0"; }
    getAuthor() { return "Grnphnx"; }

    start() {
        this.loadSettings();
        this.addPrivacyScreen();
        document.addEventListener('keydown', this.handleKeyPress);
    }

    stop() {
        this.removePrivacyScreen();
        document.removeEventListener('keydown', this.handleKeyPress);
    }

    loadSettings() {
        const settings = BdApi.loadData(this.getName(), "settings");
        if (settings) {
            this.darkness = settings.darkness;
            this.opacity = settings.opacity;
            this.blur = settings.blur;
            this.showImage = settings.showImage;
            this.backgroundImageUrl = settings.backgroundImageUrl;
            this.imageSize = settings.imageSize || 80;
        }
    }

    saveSettings() {
        BdApi.saveData(this.getName(), "settings", {
            darkness: this.darkness,
            opacity: this.opacity,
            blur: this.blur,
            showImage: this.showImage,
            backgroundImageUrl: this.backgroundImageUrl,
            imageSize: this.imageSize
        });
    }

    addPrivacyScreen() {
        const screen = document.createElement("div");
        screen.id = "privacy-screen";
        screen.style.position = "fixed";
        screen.style.top = "0";
        screen.style.left = "0";
        screen.style.width = "100%";
        screen.style.height = "100%";
        screen.style.backgroundColor = `rgba(0, 0, 0, ${this.darkness})`;
        screen.style.opacity = this.opacity;
        screen.style.zIndex = "9999";
        screen.style.display = this.privacyScreenEnabled ? "block" : "none";
        document.body.appendChild(screen);

        const imageContainer = document.createElement("div");
        imageContainer.id = "privacy-image-container";
        imageContainer.style.position = "fixed";
        imageContainer.style.top = "50%";
        imageContainer.style.left = "50%";
        imageContainer.style.transform = "translate(-50%, -50%)";
        imageContainer.style.width = `${this.imageSize}%`;
        imageContainer.style.height = `${this.imageSize}%`;
        imageContainer.style.backgroundSize = "contain";
        imageContainer.style.backgroundRepeat = "no-repeat";
        imageContainer.style.backgroundPosition = "center";
        imageContainer.style.zIndex = "10000";
        screen.appendChild(imageContainer);

        const leftArrow = document.createElement("div");
        leftArrow.innerHTML = "◀"; // Left arrow symbol
        leftArrow.style.position = "absolute";
        leftArrow.style.top = "50%";
        leftArrow.style.left = "10px";
        leftArrow.style.transform = "translateY(-50%)";
        leftArrow.style.fontSize = "2em";
        leftArrow.style.color = "White";
        leftArrow.style.opacity = "5%";
        leftArrow.style.cursor = "pointer";
        leftArrow.onclick = () => this.showPreviousMeme();
        screen.appendChild(leftArrow);

        const rightArrow = document.createElement("div");
        rightArrow.innerHTML = "▶"; // Right arrow symbol
        rightArrow.style.position = "absolute";
        rightArrow.style.top = "50%";
        rightArrow.style.right = "10px";
        rightArrow.style.transform = "translateY(-50%)";
        rightArrow.style.fontSize = "2em";
        rightArrow.style.color = "white";
        rightArrow.style.opacity = "5%";
        rightArrow.style.cursor = "pointer";
        rightArrow.onclick = () => this.showNextMeme();
        screen.appendChild(rightArrow);

        const popup = document.createElement("div");
        popup.id = "privacy-popup";
        popup.style.position = "fixed";
        popup.style.top = "50%";
        popup.style.left = "50%";
        popup.style.transform = "translate(-50%, -50%)";
        popup.style.width = `${this.imageSize}%`;
        popup.style.height = `${this.imageSize}%`;
        popup.style.backgroundSize = "contain";
        popup.style.backgroundRepeat = "no-repeat";
        popup.style.backgroundPosition = "center";
        popup.style.zIndex = "10001";
        popup.style.display = this.showImage ? "block" : "none";
        screen.appendChild(popup);

        this.updateBackgroundImage();
        this.applyBlur();
    }

    removePrivacyScreen() {
        const screen = document.getElementById("privacy-screen");
        if (screen) screen.remove();
        this.removeBlur();
    }

    handleKeyPress(event) {
        if (event.altKey && event.shiftKey) {
            this.togglePrivacyScreen();
        } else if (event.key === "ArrowUp") {
            this.showPreviousMeme();
        } else if (event.key === "ArrowDown") {
            this.showNextMeme();
        }
    }

    togglePrivacyScreen() {
        this.privacyScreenEnabled = !this.privacyScreenEnabled;
        const screen = document.getElementById("privacy-screen");
        screen.style.display = this.privacyScreenEnabled ? "block" : "none";
        const popup = document.getElementById("privacy-popup");
        popup.style.display = this.showImage ? "block" : "none";
        this.applyBlur();

        if (this.privacyScreenEnabled && this.showImage) {
            this.fetchRandomMemes();
        }
    }

    applyBlur() {
        const app = document.querySelector("#app-mount");
        if (app) {
            app.style.filter = this.privacyScreenEnabled ? `blur(${this.blur}px)` : "none";
        }
    }

    removeBlur() {
        const app = document.querySelector("#app-mount");
        if (app) {
            app.style.filter = "none";
        }
    }

    async fetchRandomMemes() {
        try {
            const response = await fetch('https://meme-api.com/gimme/10'); // Fetch 10 memes
            const data = await response.json();
            if (data.memes) {
                this.memes = data.memes.map(meme => meme.url);
                this.currentMemeIndex = 0;
                this.updateBackgroundImage();
                this.saveSettings();
            }
        } catch (error) {
            console.error('Error fetching random memes:', error);
        }
    }

    updateBackgroundImage() {
        const imageContainer = document.getElementById("privacy-image-container");
        const popup = document.getElementById("privacy-popup");
        if (imageContainer && popup) {
            if (this.showImage && this.memes.length > 0) {
                imageContainer.style.backgroundImage = `url(${this.memes[this.currentMemeIndex]})`;
                popup.style.backgroundImage = `url(${this.memes[this.currentMemeIndex]})`;
            } else {
                imageContainer.style.backgroundImage = '';
                popup.style.backgroundImage = '';
            }
        }
    }

    showPreviousMeme() {
        if (this.memes.length > 0) {
            this.currentMemeIndex = (this.currentMemeIndex - 1 + this.memes.length) % this.memes.length;
            this.updateBackgroundImage();
        }
    }

    showNextMeme() {
        if (this.memes.length > 0) {
            this.currentMemeIndex = (this.currentMemeIndex + 1) % this.memes.length;
            this.updateBackgroundImage();
        }
    }

    getSettingsPanel() {
        const panel = document.createElement("div");
        panel.style.padding = "10px";
        panel.style.color = "white";

        const createSlider = (labelText, min, max, step, value, onChange) => {
            const container = document.createElement("div");
            container.style.marginBottom = "10px";

            const label = document.createElement("label");
            label.innerText = labelText;
            label.style.display = "block";
            label.style.marginBottom = "5px";
            label.style.color = "white";

            const input = document.createElement("input");
            input.type = "range";
            input.min = min;
            input.max = max;
            input.step = step;
            input.value = value;
            input.oninput = (e) => onChange(e.target.value);

            container.appendChild(label);
            container.appendChild(input);
            return container;
        };

        const createToggle = (labelText, checked, onChange) => {
            const container = document.createElement("div");
            container.style.marginBottom = "10px";

            const label = document.createElement("label");
            label.innerText = labelText;
            label.style.display = "block";
            label.style.marginBottom = "5px";
            label.style.color = "white";
    
            const input = document.createElement("input");
            input.type = "checkbox";
            input.checked = checked;
            input.onchange = (e) => onChange(e.target.checked);
    
            container.appendChild(label);
            container.appendChild(input);
            return container;
        };
    
        panel.appendChild(createSlider("Darkness", 0, 1, 0.1, this.darkness, (value) => {
            this.darkness = value;
            document.getElementById("privacy-screen").style.backgroundColor = `rgba(0, 0, 0, ${this.darkness})`;
            this.saveSettings();
        }));
    
        panel.appendChild(createSlider("Opacity", 0, 1, 0.1, this.opacity, (value) => {
            this.opacity = value;
            document.getElementById("privacy-screen").style.opacity = this.opacity;
            this.saveSettings();
        }));
    
        panel.appendChild(createSlider("Blur", 0, 10, 1, this.blur, (value) => {
            this.blur = value;
            this.applyBlur();
            this.saveSettings();
        }));
    
        panel.appendChild(createSlider("Image Size", 10, 80, 1, this.imageSize, (value) => {
            this.imageSize = value;
            const popup = document.getElementById("privacy-popup");
            popup.style.width = `${this.imageSize}%`;
            popup.style.height = `${this.imageSize}%`;
            this.saveSettings();
        }));
    
        panel.appendChild(createToggle("Show Image", this.showImage, (checked) => {
            this.showImage = checked;
            const popup = document.getElementById("privacy-popup");
            popup.style.display = this.showImage ? "block" : "none";
            this.updateBackgroundImage();
            this.saveSettings();
        }));
    

    
        return panel;
    }
    };
    