function goHome() {
    window.location.href = 'index.html';
}

function goConsultation() {
    window.location.href = 'consultation.html';
}

function calculateScore() {
    // 入力値を取得
    const distance = parseFloat(document.getElementById('distance').value) || 0;
    const timeOfDay = document.getElementById('timeOfDay').value;
    
    const hardBrake = parseInt(document.querySelector('input[name="hardBrake"]:checked').value);
    const hardAccel = parseInt(document.querySelector('input[name="hardAccel"]:checked').value);
    const speeding = parseInt(document.querySelector('input[name="speeding"]:checked').value);
    const phone = parseInt(document.querySelector('input[name="phone"]:checked').value);
    const signal = parseInt(document.querySelector('input[name="signal"]:checked').value);
    
    // バリデーション
    if (distance === 0) {
        alert('走行距離を入力してください。');
        return;
    }
    if (timeOfDay === '') {
        alert('主な走行時間帯を選択してください。');
        return;
    }
    
    // スコア計算（基本点70点 + 減点）
    let score = 70;
    
    // 急ブレーキ・急加速
    score -= hardBrake * 5;
    score -= hardAccel * 4;
    
    // 速度超過
    score -= speeding * 6;
    
    // スマホ操作
    score -= phone * 8;
    
    // 信号・一時停止
    score += signal * 3; // 適切なら加点
    
    // 時間帯による調整
    if (timeOfDay === 'night' || timeOfDay === 'late') {
        score -= 2;
    }
    if (timeOfDay === 'evening') {
        score -= 1;
    }
    
    // 長距離ボーナス（安全運転の意識向上）
    if (distance > 20) {
        score += 2;
    }
    
    // スコアを0-100の範囲に調整
    if (score > 100) score = 100;
    if (score < 0) score = 0;
    
    // 結果を表示
    displayResult(Math.round(score), {hardBrake, hardAccel, speeding, phone, signal, timeOfDay, distance});
}

function displayResult(score, factors) {
    document.getElementById('checkerForm').style.display = 'none';
    document.getElementById('resultContainer').style.display = 'block';
    
    // スコア表示
    document.getElementById('scoreNumber').textContent = score;
    
    // グレード判定
    let grade, message, improvements = [], advice = '';
    
    if (score >= 95) {
        grade = 'S級 - 素晴らしい安全運転です！';
        message = 'あなたの運転は非常に安全的です。素晴らしい習慣を続けていきましょう。';
        improvements = ['現在の良い習慣を維持してください'];
        advice = '安全運転の意識が高く素晴らしいです。周囲のドライバーへの模範となる運転を続けてください。小さな気づきも大切にしていきましょう。';
    } else if (score >= 90) {
        grade = 'A級 - 良好な安全運転です';
        message = '良好な安全運転ができています。わずかな改善でさらに向上できます。';
        improvements = [
            factors.hardBrake >= 1 ? '急ブレーキを減らすため、早めの減速を心がけましょう' : null,
            factors.speeding >= 1 ? '法定速度を遵守し、余裕を持った速度設定を心がけましょう' : null
        ].filter(Boolean);
        advice = '急ブレーキが減りました。前方の交通状況を予測して、ゆっくりと減速することで、より安全でスムーズな運転ができます。';
    } else if (score >= 80) {
        grade = 'B級 - 普通レベルの安全運転';
        message = '基本的な安全運転はできていますが、いくつか改善の余地があります。';
        improvements = [
            factors.hardBrake >= 1 ? '急ブレーキ：前方確認を早期にし、エンジンブレーキを活用しましょう' : null,
            factors.hardAccel >= 1 ? '急加速：穏やかなアクセル操作を心がけましょう' : null,
            factors.speeding >= 1 ? '速度超過：制限速度を確認し、必要以上のスピードは避けましょう' : null,
            factors.phone >= 1 ? 'ながら運転：運転中はスマホ操作を避け、安全な場所で行いましょう' : null
        ].filter(Boolean);
        if (improvements.length === 0) improvements = ['信号・一時停止をより意識的に守りましょう'];
        advice = '相手に合わせて、前向きな言葉で伝えるように：まずは「ゆっくり発進」「早めの減速」から始めてみてください。少しずつ意識するだけで大きく変わります。';
    } else if (score >= 70) {
        grade = 'C級 - 注意が必要です';
        message = 'いくつか危険な運転習慣が見られます。早期の改善が必要です。';
        improvements = [
            factors.hardBrake >= 1 ? '急ブレーキ：車間距離を十分に保ち、予測運転を心がけましょう' : null,
            factors.speeding >= 1 ? '速度超過：速度計をこまめに確認し、制限速度内で走行しましょう' : null,
            factors.phone >= 2 ? 'ながら運転：これは最も危険です。絶対に避けてください' : factors.phone >= 1 ? 'ながら運転：運転専念を心がけましょう' : null,
            factors.signal <= 1 ? 'ルール遵守：信号・一時停止を必ず守りましょう' : null
        ].filter(Boolean);
        advice = '安全第一で考えてみましょう。車間距離の確保、速度の遵守、運転中の集中が最優先です。焦らず余裕を持った運転を心がけてください。';
    } else {
        grade = 'D級 - 大幅な改善が必要です';
        message = '危険度が高い運転習慣が多く見られます。安全運転講習の受講も検討してください。';
        improvements = [
            '速度超過・ながら運転は生命に関わる危険行為です。直ちに改善してください',
            '車間距離を十分に保ち、焦らない運転を心がけてください',
            '信号・標識・一時停止を必ず遵守してください',
            '運転に集中し、必要であれば安全運転講習の受講を検討してください'
        ];
        advice = '命を守るために、今すぐ運転習慣を見直してください。焦りや慣れが一番の危険です。余裕を持った時間設定と、運転への集中が何より大切です。';
    }
    
    document.getElementById('scoreGrade').textContent = grade;
    document.getElementById('resultMessage').innerHTML = `<p>${message}</p>`;
    
    // 改善ポイントを表示
    const improvementList = document.getElementById('improvementList');
    improvementList.innerHTML = '';
    improvements.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        improvementList.appendChild(li);
    });
    
    // AIアドバイスを表示
    document.getElementById('aiAdviceContent').innerHTML = `<p>${advice}</p>`;
    
    // 結果画面までスクロール
    document.getElementById('resultContainer').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function retakeCheck() {
    document.getElementById('checkerForm').style.display = 'block';
    document.getElementById('resultContainer').style.display = 'none';
    
    // フォームをリセット
    document.getElementById('distance').value = '';
    document.getElementById('timeOfDay').value = '';
    document.querySelector('input[name="hardBrake"][value="0"]').checked = true;
    document.querySelector('input[name="hardAccel"][value="0"]').checked = true;
    document.querySelector('input[name="speeding"][value="0"]').checked = true;
    document.querySelector('input[name="phone"][value="0"]').checked = true;
    document.querySelector('input[name="signal"][value="2"]').checked = true;
    
    // フォーム画面までスクロール
    document.getElementById('checkerForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
