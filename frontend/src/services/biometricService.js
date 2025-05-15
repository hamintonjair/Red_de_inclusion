/* global PublicKeyCredential */

// Helper para convertir ArrayBuffer a Base64URL string
function arrayBufferToBase64Url(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

// Helper para convertir el objeto PublicKeyCredential a un formato JSON serializable
// con ArrayBuffers convertidos a Base64URL
function publicKeyCredentialToJSON(pubKeyCred) {
    if (!pubKeyCred) return null; // Manejar caso de credencial nula

    if (pubKeyCred instanceof Array) {
        return pubKeyCred.map(publicKeyCredentialToJSON);
    }
    if (pubKeyCred instanceof ArrayBuffer) {
        return arrayBufferToBase64Url(pubKeyCred);
    }
    if (pubKeyCred instanceof Object) {
        const obj = {};
        for (const key in pubKeyCred) {
            if (pubKeyCred.hasOwnProperty(key)) {
                // rawId es un ArrayBuffer, pero id es la versión string que queremos.
                // La especificación dice que .id es el Base64URL de rawId.
                // publicKeyCredentialToJSON se asegura que rawId (ArrayBuffer) se convierta 
                // y se asigne a 'id' en el objeto JSON final.
                if (key === 'rawId' && pubKeyCred[key] instanceof ArrayBuffer) {
                    obj.id = arrayBufferToBase64Url(pubKeyCred[key]);
                } else if (key === 'response') { // Manejar el objeto de respuesta específicamente
                    obj[key] = publicKeyCredentialToJSON(pubKeyCred[key]);
                } else {
                     obj[key] = publicKeyCredentialToJSON(pubKeyCred[key]);
                }
            }
        }
        // Asegurarnos que 'id' esté presente si 'rawId' lo estaba.
        if (pubKeyCred.rawId && !obj.id) {
            obj.id = arrayBufferToBase64Url(pubKeyCred.rawId);
        }
        
        return obj;
    }
    return pubKeyCred; // Devuelve tipos primitivos tal cual
}

export const biometricService = {
    async isSupported() {
        if (!window.PublicKeyCredential) {
            console.warn("WebAuthn (PublicKeyCredential) no soportado por este navegador.");
            return false;
        }
        try {
            // Detección simplificada, isUserVerifyingPlatformAuthenticatorAvailable es la más confiable
            const platformSupport = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            console.log("Soporte de autenticador de plataforma:", platformSupport);
            return platformSupport;
        } catch (error) {
            console.error('Error al verificar soporte biométrico:', error);
            return false;
        }
    },

    async registrarHuella(userId, userName) {
        try {
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            const publicKeyCredentialCreationOptions = {
                challenge,
                rp: { name: "Red de Inclusión", id: window.location.hostname },
                user: {
                    id: Uint8Array.from(String(userId), c => c.charCodeAt(0)),
                    name: userName,
                    displayName: userName
                },
                pubKeyCredParams: [
                    { alg: -7, type: "public-key" }, // ES256 (ECDSA con P-256)
                    { alg: -257, type: "public-key" } // RS256 (RSA PKCS#1 v1.5 con SHA-256)
                ],
                authenticatorSelection: {
                    authenticatorAttachment: "platform", // Preferir autenticadores integrados
                    userVerification: "preferred",    // Preferir verificación del usuario pero no requerirla
                    residentKey: "discouraged",       // No requerir que la credencial sea "discoverable"
                    requireResidentKey: false,        // Explicitamente no requerir resident key
                },
                timeout: 60000, // Tiempo de espera en milisegundos
                attestation: "none" // No requerir atestación para simplificar
            };

            const credential = await navigator.credentials.create({
                publicKey: publicKeyCredentialCreationOptions
            });
            
            if (!credential) {
                throw new Error('La creación de credenciales no devolvió un objeto.');
            }

            // Convertir el objeto PublicKeyCredential a un JSON serializable
            const credentialJSON = publicKeyCredentialToJSON(credential);
            console.log('biometricService, JUSTO ANTES DE RETORNAR, credentialJSON:', credentialJSON); // <--- AÑADE ESTA LÍNEA
            return credentialJSON; // Devolver el objeto serializado

        } catch (error) {
            console.error('Error detallado al registrar huella:', error, error.name, error.message);
            if (error.name === 'NotAllowedError') {
                throw new Error('Registro de huella cancelado o no permitido por el usuario.');
            } else if (error.name === 'InvalidStateError') {
                 throw new Error('El autenticador ya puede estar registrado para este usuario o hay un problema de estado (InvalidStateError).');
            } else if (error.name === "NotSupportedError") {
                throw new Error('La operación no es soportada por el autenticador o la plataforma (NotSupportedError).');
            }
            throw new Error(`No se pudo registrar la huella dactilar: ${error.message || 'Error desconocido.'}`);
        }
    },

    async verificarHuella(credentialIdB64Url, challengeFromServerB64Url) {
        try {
            // Decodificar challenge de Base64URL a ArrayBuffer
            const challengeString = atob(challengeFromServerB64Url.replace(/-/g, '+').replace(/_/g, '/'));
            const challenge = new Uint8Array(challengeString.length);
            for (let i = 0; i < challengeString.length; i++) {
                challenge[i] = challengeString.charCodeAt(i);
            }

            // Decodificar credentialId de Base64URL a ArrayBuffer
            const credentialIdString = atob(credentialIdB64Url.replace(/-/g, '+').replace(/_/g, '/'));
            const rawId = new Uint8Array(credentialIdString.length);
            for (let i = 0; i < credentialIdString.length; i++) {
                rawId[i] = credentialIdString.charCodeAt(i);
            }

            const publicKeyCredentialRequestOptions = {
                challenge,
                allowCredentials: [{
                    id: rawId,
                    type: 'public-key',
                    transports: ['internal', 'platform'], // 'platform' es sinónimo de 'internal' en algunos contextos
                }],
                timeout: 60000,
                userVerification: 'required', 
                rpId: window.location.hostname
            };

            const assertion = await navigator.credentials.get({
                publicKey: publicKeyCredentialRequestOptions
            });

            if (!assertion) {
                throw new Error('La verificación de credenciales no devolvió un objeto (aserción).');
            }

            return publicKeyCredentialToJSON(assertion);

        } catch (error) {
            console.error('Error detallado al verificar huella:', error, error.name, error.message);
            if (error.name === 'NotAllowedError') {
                throw new Error('Verificación de huella cancelada o no permitida por el usuario.');
            }
            throw new Error(`No se pudo verificar la huella dactilar: ${error.message || 'Error desconocido.'}`);
        }
    }
};
