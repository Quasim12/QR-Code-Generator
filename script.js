const qrText = document.getElementById('qr-text');
const sizes = document.getElementById('sizes');
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const qrContainer = document.querySelector('.qr-body');
const totpDisplay = document.createElement('div');
const countdownDisplay = document.createElement('div');
const totpInput = document.createElement('input'); // Create an input for TOTP validation
const verifyBtn = document.createElement('button'); // Create a button for verifying TOTP

totpDisplay.classList.add('totp-display');
countdownDisplay.classList.add('countdown-display');
totpInput.classList.add('totp-input'); // Add class for styling TOTP input
verifyBtn.textContent = 'Verify TOTP'; // Button text

let size = sizes.value;
let intervalId = null;
let secret = ''; // Store the secret globally for validation

generateBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (qrText.value.length > 0) {
        generateQRCode();
        downloadBtn.classList.remove('disabled'); // Enable download button after generation
    } else {
        alert("Enter the account name or email to generate your QR code");
    }
});

sizes.addEventListener('change', (e) => {
    size = e.target.value;
    if (qrText.value.length > 0) {
        generateQRCode();
    }
});

downloadBtn.addEventListener('click', (e) => {
    let img = document.querySelector('.qr-body img');
    if (img !== null) {
        let imgAttr = img.getAttribute('src');
        downloadBtn.setAttribute("href", imgAttr);
    } else {
        downloadBtn.setAttribute("href", document.querySelector('canvas').toDataURL());
    }
});

function generateQRCode() {
    qrContainer.innerHTML = "";
    totpDisplay.innerHTML = "";
    countdownDisplay.innerHTML = "";
    totpInput.value = ""; // Clear the TOTP input
    qrContainer.appendChild(totpInput); // Add the TOTP input to the container
    qrContainer.appendChild(verifyBtn); // Add the verify button to the container

    secret = generateSecretKey(); // Generate a new secret key
    const issuer = "MyApp";
    const account = qrText.value;

    const qrCodeURL = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}`;

    new QRCode(qrContainer, {
        text: qrCodeURL,
        height: size,
        width: size,
        colorLight: "#fff",
        colorDark: "#000",
    });

    qrContainer.appendChild(totpDisplay); 
    qrContainer.appendChild(countdownDisplay);

    if (intervalId) clearInterval(intervalId);

    updateTOTP(secret); // Initial TOTP display
    intervalId = setInterval(() => {
        updateTOTP(secret);
    }, 1000); // Refresh TOTP and countdown every second
}

function generateSecretKey() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // Base32 characters
    let secret = '';
    for (let i = 0; i < 16; i++) { // Generate a 16-character Base32 key
        secret += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return secret;
}

function updateTOTP(secret) {
    const timeLeft = 30 - (Math.floor(Date.now() / 1000) % 30); // Calculate seconds left
    const totp = generateTOTP(secret);
    totpDisplay.innerHTML = `<h2>Your TOTP: ${totp}</h2>`;
    countdownDisplay.innerHTML = `<p>Refreshing in: ${timeLeft} seconds</p>`;
}

function generateTOTP(secret) {
    const epoch = Math.floor(Date.now() / 1000);
    const time = Math.floor(epoch / 30); // Time step of 30 seconds
    const key = base32ToHex(secret);
    const shaObj = new jsSHA("SHA-1", "HEX");
    shaObj.setHMACKey(key, "HEX");
    shaObj.update(time.toString(16).padStart(16, '0'));
    const hmac = shaObj.getHMAC("HEX");

    const offset = parseInt(hmac.substring(hmac.length - 1), 16);
    const otp = (parseInt(hmac.substring(offset * 2, offset * 2 + 8), 16) & 0x7fffffff) + '';
    
    const totp = otp.substring(otp.length - 6).padStart(6, '0'); // Ensure 6-digit OTP
    return totp;
}

function base32ToHex(base32) {
    const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = "";
    let hex = "";

    for (let i = 0; i < base32.length; i++) {
        let val = base32chars.indexOf(base32.charAt(i).toUpperCase());
        bits += val.toString(2).padStart(5, '0');
    }

    for (let i = 0; i + 4 <= bits.length; i += 4) {
        let chunk = bits.substring(i, i + 4);
        hex = hex + parseInt(chunk, 2).toString(16);
    }

    return hex.padEnd(40, '0');
}

// Verify TOTP when the button is clicked
verifyBtn.addEventListener('click', () => {
    const inputTotp = totpInput.value.trim(); // Get the user's input TOTP
    const currentTotp = generateTOTP(secret); // Generate the current TOTP

    if (inputTotp === currentTotp) {
        alert("TOTP verified successfully!");
    } else {
        alert("Invalid TOTP. Please try again.");
    }
});
