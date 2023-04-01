const { Client } = require('whatsapp-web.js');
const moment = require('moment');
const qrcode = require('qrcode-terminal');


const readline = require('readline');
const axios = require('axios');
const apikey = process.env.OPENAI_API_KEY
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const messages = [{"role": "system", "content": "You are an helpful assistant."}]
function askQuestion() {

// Kişinin telefon numarasını buraya yaz. + kullanma. @c.us'u kaldırma. örnek format "905xxxxxxxxx@c.us"
    const targetNumber = '90xxxxxxxxxx@c.us';

    const client = new Client();

    client.on('qr', (qr) => {
        // QR kodu göstermek için bir yolu seçin (console.log, resim dosyası, vb.)
        qrcode.generate(qr, {small: true});
    });

    client.on('ready', () => {
        console.log('WhatsApp Web API çalışıyor!');
    });
    client.on('ready', async () => {
        const chat = await client.getChatById(targetNumber);
        console.log(chat)
        /*    console.log(chat.presence.lastKnownPresence.toISOString());*/
    });
    client.on('message', async (msg) => {
        // Sadece target number'a cevap vermek için aşağıdaki command-line'ları kaldır.

        /*if (msg.from === targetNumber) {*/
            console.log(`Gelen mesaj: ${msg.body}`);
            //ben mesaj içinde "kanka" kelimesi geçme koşulu ekledim. regex'le ,  chatgpt sadece içinde "kanka" geçen mesajlara cevap veriyor
            const name = "kanka"
            const regex = new RegExp(name, "gi");
            if (msg.body.match(regex)) {
                messages.push({"role": "user", "content": msg.body.replace("kanka","").replace("Kanka","")})
                console.log("messages",messages)
                axios.post('https://api.openai.com/v1/chat/completions',
                    {
                        model: "gpt-3.5-turbo",
                        messages: messages,
                        temperature: 0.7

                    }, {
                        headers: {
                            'Authorization': `Bearer ${apikey}`,
                            'Content-Type': 'application/json',
                        },

                    },)
                    .then(response => {
                        console.log("response",response.data.choices[0].message.content)
                        messages.push({"role": "assistant", "content": response.data.choices[0].message.content})
                        const text = response.data.choices[0].message.content;
                        console.log(`Tamamlanan cümle: ${text}`);
                        msg.reply(text);
                        askQuestion();
                    })
                    .catch(error => {
                        console.log(error);
                    });
            }
 /*       }*/

        /*if (msg.body === '!ping') {
            msg.reply('müsait değilim.');
        }*/
    });

    client.on('auth_failure', () => {
        console.log('Kimlik doğrulama hatası! Lütfen QR kodunu yeniden tara.');
    });


    client.initialize();



}
askQuestion()
