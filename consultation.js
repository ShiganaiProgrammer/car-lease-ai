let conversationStep = 0;
let userInfo = {};

function goHome() {
    window.location.href = 'index.html';
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function quickReply(text) {
    document.getElementById('userInput').value = text;
    sendMessage();
}

function addMessage(content, isUser = false) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = isUser ? 'message message-user' : 'message message-ai';
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${isUser ? '👤' : '🤖'}</div>
        <div class="message-content">
            ${content.split('\n').map(line => `<p>${line}</p>`).join('')}
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('userInput');
    const message = input.value.trim();
    
    if (message === '') return;
    
    // ユーザーメッセージを追加
    addMessage(message, true);
    input.value = '';
    
    // 提案ボタンを非表示
    document.getElementById('suggestions').style.display = 'none';
    
    // AI応答をシミュレート
    setTimeout(() => {
        generateAIResponse(message);
    }, 800);
}

function generateAIResponse(userMessage) {
    conversationStep++;
    
    if (conversationStep === 1) {
        userInfo.status = userMessage;
        addMessage(`なるほど、${userMessage}ですね。<br><br>次にお聞かせください。<br>車の使用目的は何ですか？（例：通勤用、買い物用、レジャー用など）<br>また、希望の契約期間の目安はありますか？（1〜4年から選べます）`);
        
        // 提案を再表示
        setTimeout(() => {
            const suggestions = document.getElementById('suggestions');
            suggestions.innerHTML = `
                <button class="suggestion-btn" onclick="quickReply('主に通勤用です')">通勤用</button>
                <button class="suggestion-btn" onclick="quickReply('買い物・家事用です')">買い物・家事用</button>
                <button class="suggestion-btn" onclick="quickReply('レジャー・旅行用です')">レジャー・旅行用</button>
                <button class="suggestion-btn" onclick="quickReply('2年程度を考えています')">2年程度</button>
                <button class="suggestion-btn" onclick="quickReply('3年程度を考えています')">3年程度</button>
            `;
            suggestions.style.display = 'flex';
        }, 100);
    } else if (conversationStep === 2) {
        userInfo.purpose = userMessage;
        addMessage(`ありがとうございます。<br><br>予算の目安はありますか？<br>（月額〇〇万円程度など、ざっくりで大丈夫です）`);
        
        setTimeout(() => {
            const suggestions = document.getElementById('suggestions');
            suggestions.innerHTML = `
                <button class="suggestion-btn" onclick="quickReply('月額3万円前後')">月額3万円前後</button>
                <button class="suggestion-btn" onclick="quickReply('月額4万円前後')">月額4万円前後</button>
                <button class="suggestion-btn" onclick="quickReply('月額5万円前後')">月額5万円前後</button>
                <button class="suggestion-btn" onclick="quickReply('相談しながら決めたい')">相談しながら決めたい</button>
            `;
            suggestions.style.display = 'flex';
        }, 100);
    } else if (conversationStep === 3) {
        userInfo.budget = userMessage;
        addMessage(`承知しました。あなたにぴったりの車種をご提案します。<br><br>【提案内容】<br>・状況：${userInfo.status}<br>・用途：${userInfo.purpose}<br>・予算：${userInfo.budget}<br><br>この条件に合う車種をピックアップしています...`);
        
        setTimeout(() => {
            addMessage(`提案が完了しました！<br><br>おすすめの車種：<br>1. トヨタ ヤリス（コンパクト） - 月額2.8万円〜 / リース期間1〜3年<br>2. ホンダ フィット（コンパクト） - 月額3.0万円〜 / リース期間1〜4年<br>3. トヨタ シエンタ（コンパクトミニバン） - 月額3.8万円〜 / リース期間2〜4年<br><br>詳細を見たり、申込を進めるにはマイページからご確認いただけます。<br><br>このAIパートナーは車が変わっても記憶を引き継ぎ、今後もあなたのライフステージに寄り添います。`);
            
            setTimeout(() => {
                const suggestions = document.getElementById('suggestions');
                suggestions.innerHTML = `
                    <button class="suggestion-btn" onclick="goHome()">ホームに戻る</button>
                    <button class="suggestion-btn" onclick="restartConsultation()">もう一度相談する</button>
                `;
                suggestions.style.display = 'flex';
            }, 200);
        }, 1500);
    }
}

function restartConsultation() {
    conversationStep = 0;
    userInfo = {};
    document.getElementById('chatMessages').innerHTML = `
        <div class="message message-ai">
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <p>こんにちは！私はあなたの専属AIパートナーです。</p>
                <p>車のこと、ライフスタイルのことをお聞かせいただければ、最適な短期リースをご提案します。</p>
                <p>まず、どのような状況ですか？（例：大学生、新社会人、転勤予定、子育て中など）</p>
            </div>
        </div>
    `;
    document.getElementById('suggestions').innerHTML = `
        <button class="suggestion-btn" onclick="quickReply('大学生です')">大学生です</button>
        <button class="suggestion-btn" onclick="quickReply('新社会人です')">新社会人です</button>
        <button class="suggestion-btn" onclick="quickReply('転勤が決まっています')">転勤が決まっています</button>
        <button class="suggestion-btn" onclick="quickReply('結婚・子育て中です')">結婚・子育て中です</button>
    `;
    document.getElementById('suggestions').style.display = 'flex';
}
