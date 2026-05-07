(function() {
    const script = document.getElementById('legacymark-loader');
    if (!script) {
        console.warn('LegacyMark Loader: Script tag with id="legacymark-loader" not found.');
        return;
    }

    const apiKey = script.getAttribute('data-api-key');
    const baseUrl = script.getAttribute('data-base-url') || 'https://legacymarksas.com';
    
    if (!apiKey) {
        console.error('LegacyMark Loader: data-api-key is missing.');
        return;
    }

    // 1. Create Styles
    const style = document.createElement('style');
    style.innerHTML = `
        #lm-chat-wrapper {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 999999;
            font-family: sans-serif;
        }
        #lm-chat-button {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #14b8a6, #10b981);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.3s ease;
        }
        #lm-chat-button:hover {
            transform: scale(1.1);
        }
        #lm-chat-button svg {
            width: 30px;
            height: 30px;
            color: white;
        }
        #lm-chat-iframe-container {
            position: absolute;
            bottom: 80px;
            right: 0;
            width: 380px;
            height: 600px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            overflow: hidden;
            display: none;
            border: 1px solid rgba(0,0,0,0.1);
        }
        @media (max-width: 480px) {
            #lm-chat-iframe-container {
                width: 90vw;
                height: 70vh;
                right: -10px;
            }
        }
    `;
    document.head.appendChild(style);

    // 2. Create Elements
    const wrapper = document.createElement('div');
    wrapper.id = 'lm-chat-wrapper';

    const container = document.createElement('div');
    container.id = 'lm-chat-iframe-container';
    
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    
    // Visitor ID (Sticky session)
    let visitorId = localStorage.getItem('lm_visitor_id');
    if (!visitorId) {
        visitorId = 'v_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('lm_visitor_id', visitorId);
    }

    iframe.src = `${baseUrl}/widget/chat?apiKey=${apiKey}\u0026visitorId=${visitorId}`;
    
    container.appendChild(iframe);

    const button = document.createElement('div');
    button.id = 'lm-chat-button';
    button.innerHTML = `\u003csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"\u003e\u003cpath d=\"m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z\"\u003e\u003c/path\u003e\u003c/svg\u003e`;

    button.onclick = function() {
        const isOpen = container.style.display === 'block';
        container.style.display = isOpen ? 'none' : 'block';
    };

    window.addEventListener('message', function(event) {
        if (event.data === 'lm-chat-close') {
            container.style.display = 'none';
        }
    });

    wrapper.appendChild(container);
    wrapper.appendChild(button);
    document.body.appendChild(wrapper);

})();
