let watchId = null;
let accelWatchId = null;
let startTime = null;
let elapsedInterval = null;
let lastPosition = null;
let lastTime = null;
let totalDistance = 0;
let hardBrakeCount = 0;
let hardAccelCount = 0;
let eventsLog = [];
let firstFix = false;

const BRAKE_THRESHOLD = -8.0; // m/s^2 (約-0.8G) 急ブレーキ判定
const ACCEL_THRESHOLD = 6.0;  // m/s^2 (約0.6G) 急加速判定
const SPEED_BRAKE_THRESHOLD = -15; // km/h/s 急減速判定

function goHome() {
    window.location.href = 'index.html';
}

function goManual() {
    window.location.href = 'safety-checker.html';
}

function goConsultation() {
    window.location.href = 'consultation.html';
}

function startDetection() {
    document.getElementById('permissionContainer').style.display = 'none';
    document.getElementById('detectionContainer').style.display = 'block';
    
    startTime = Date.now();
    lastTime = null;
    lastPosition = null;
    totalDistance = 0;
    hardBrakeCount = 0;
    hardAccelCount = 0;
    firstFix = false;
    
    document.getElementById('hardBrakeCount').textContent = '0';
    document.getElementById('hardAccelCount').textContent = '0';
    document.getElementById('currentSpeed').textContent = '0';
    document.getElementById('totalDistance').textContent = '0.000';
    document.getElementById('debugInfo').textContent = 'GPS信号を検索中... 屋外での測定を推奨します';
    
    // 経過時間更新
    if (elapsedInterval) clearInterval(elapsedInterval);
    elapsedInterval = setInterval(updateElapsedTime, 1000);
    
    // 位置情報の監視開始
    if (navigator.geolocation) {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
        }
        watchId = navigator.geolocation.watchPosition(
            handlePositionUpdate,
            handlePositionError,
            {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 0
            }
        );
    } else {
        alert('このブラウザは位置情報に対応していません。');
        return;
    }
}

function handlePositionUpdate(position) {
    const currentTime = Date.now();
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const speed = position.coords.speed;
    
    const lastUpdateEl = document.getElementById('lastUpdate');
    if (lastUpdateEl) {
        const now = new Date();
        lastUpdateEl.textContent = `最終更新: ${now.toLocaleTimeString('ja-JP')}`;
    }
    
    // 初回の位置を記録（距離計算の起点として使用）
    if (!firstFix) {
        lastPosition = { lat: lat, lng: lng, calcSpeed: 0 };
        lastTime = currentTime;
        firstFix = true;
        document.getElementById('debugInfo').textContent = `GPS初期化完了 | 精度${position.coords.accuracy.toFixed(0)}m | 移動を開始してください`;
        document.getElementById('currentSpeed').textContent = '0';
        return;
    }
    
    let speedKmh = 0;
    
    // GPS速度を優先
    if (speed !== null && typeof speed === 'number' && !isNaN(speed) && speed >= 0) {
        speedKmh = speed * 3.6;
    }
    
    // 移動距離から速度を計算
    if (lastPosition && lastTime) {
        const timeDiff = (currentTime - lastTime) / 1000;
        if (timeDiff > 0.1 && timeDiff < 120) {
            const dist = calculateDistance(lastPosition.lat, lastPosition.lng, lat, lng);
            if (dist > 0.000001) {
                const calcSpeedKmh = (dist / timeDiff) * 3600;
                // GPS速度がないか小さい場合は計算速度を使用
                if (speed === null || speedKmh < calcSpeedKmh || calcSpeedKmh > speedKmh) {
                    if (calcSpeedKmh < 200) {
                        speedKmh = calcSpeedKmh;
                    }
                }
                
                // 距離を加算
                if (position.coords.accuracy <= 200 && dist < 5.0) {
                    totalDistance += dist;
                    document.getElementById('totalDistance').textContent = totalDistance.toFixed(3);
                }
            }
        }
    }
    
    if (speedKmh < 0) speedKmh = 0;
    
    document.getElementById('debugInfo').textContent = `GPS: 精度${position.coords.accuracy.toFixed(0)}m | 速度${Math.round(speedKmh)} km/h`;
    document.getElementById('currentSpeed').textContent = Math.round(speedKmh);
    
    // イベント検出
    if (lastPosition && lastPosition.calcSpeed !== undefined && lastTime) {
        const timeDiff = (currentTime - lastTime) / 1000;
        if (timeDiff > 0.2 && timeDiff < 15) {
            const prevSpeed = lastPosition.calcSpeed;
            const diff = speedKmh - prevSpeed;
            const accelPerSec = diff / timeDiff;
            
            if (accelPerSec < -15 && speedKmh > 2 && prevSpeed > speedKmh) {
                hardBrakeCount++;
                document.getElementById('hardBrakeCount').textContent = hardBrakeCount;
                addEventLog('brake', `急ブレーキ検出`);
            } else if (accelPerSec > 12 && speedKmh > prevSpeed && speedKmh > 3) {
                hardAccelCount++;
                document.getElementById('hardAccelCount').textContent = hardAccelCount;
                addEventLog('accel', `急加速検出`);
            }
        }
    }
    
    lastPosition = { lat: lat, lng: lng, calcSpeed: speedKmh };
    lastTime = currentTime;
}

function handlePositionError(error) {
    const debugEl = document.getElementById('debugInfo');
    if (debugEl) {
        switch(error.code) {
            case 1:
                debugEl.textContent = 'エラー: 位置情報の権限が拒否されています';
                break;
            case 2:
                debugEl.textContent = 'エラー: 位置情報が取得できません（屋外で試してください）';
                break;
            case 3:
                debugEl.textContent = 'エラー: タイムアウト - 再試行中...';
                break;
            default:
                debugEl.textContent = 'エラー: 位置情報の取得に失敗しました';
        }
    }
}

function handleDeviceMotion(event) {
    if (event.accelerationIncludingGravity) {
        const acc = event.accelerationIncludingGravity;
        // x,y,z軸の加速度から前後方向の加速度を概算
        const forwardAccel = Math.sqrt(acc.x * acc.x + acc.z * acc.z);
        
        // 簡易的な急加減速判定（実際はより複雑な処理が必要）
        // ここでは主にGPSベースで判定
    }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球の半径（km）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(c));
    return R * c;
}

function addEventLog(type, message) {
    const eventsLogDiv = document.getElementById('eventsLog');
    const emptyMsg = eventsLogDiv.querySelector('.events-empty');
    if (emptyMsg) {
        emptyMsg.remove();
    }
    
    const logItem = document.createElement('div');
    logItem.className = `event-log-item ${type}`;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    logItem.innerHTML = `
        <span>${type === 'brake' ? '🛑' : '⚡'}</span>
        <span class="event-time">${timeStr}</span>
        <span>${message}</span>
    `;
    
    eventsLogDiv.prepend(logItem);
    
    // 最大10件まで表示
    while (eventsLogDiv.children.length > 10) {
        eventsLogDiv.removeChild(eventsLogDiv.lastChild);
    }
}

function updateElapsedTime() {
    if (!startTime) return;
    const elapsed = Date.now() - startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    document.getElementById('elapsedTime').textContent = timeStr;
}

function stopDetection() {
    // 監視停止
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    if (accelWatchId !== null) {
        try {
            window.removeEventListener('devicemotion', handleDeviceMotion);
        } catch(e) {}
        accelWatchId = null;
    }
    if (elapsedInterval) {
        clearInterval(elapsedInterval);
        elapsedInterval = null;
    }
    
    // 結果画面表示
    document.getElementById('detectionContainer').style.display = 'none';
    document.getElementById('resultContainerAuto').style.display = 'block';
    
    calculateAutoScore();
    
    // 結果までスクロール
    document.getElementById('resultContainerAuto').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function calculateAutoScore() {
    const elapsed = Date.now() - startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    document.getElementById('resultTime').textContent = timeStr;
    document.getElementById('resultDistance').textContent = totalDistance.toFixed(2);
    document.getElementById('summaryBrake').textContent = hardBrakeCount;
    document.getElementById('summaryAccel').textContent = hardAccelCount;
    
    // スコア計算
    let score = 95; // 基本点（位置情報ベースなのでやや寛容）
    
    // 急ブレーキによる減点
    score -= hardBrakeCount * 8;
    // 急加速による減点
    score -= hardAccelCount * 5;
    
    // 走行距離が短すぎる場合は評価を保留気味に
    if (totalDistance < 0.5) {
        score -= 10;
    }
    
    // 測定時間が短すぎる場合
    if (minutes < 1) {
        score -= 15;
    }
    
    if (score > 100) score = 100;
    if (score < 0) score = 0;
    
    document.getElementById('autoScoreNumber').textContent = Math.round(score);
    
    // 結果メッセージ
    let grade, message, advice = '';
    
    if (totalDistance < 0.3 || minutes < 0.5) {
        grade = '測定不足';
        message = '測定時間・距離が不足しています。より正確な評価のため、5分程度以上の走行を推奨します。';
        advice = '位置情報ベースの自動判定は、ある程度の走行距離が必要です。実際の道路で5〜10分程度走行してから再度測定してみてください。';
    } else if (score >= 95) {
        grade = 'S級 - 素晴らしい！';
        message = '急ブレーキ・急加速がほとんど検出されませんでした。非常にスムーズで安全な運転です。';
        advice = 'この調子で前方予測を活かした穏やかな運転を続けてください。エコドライブにもつながります。';
    } else if (score >= 90) {
        grade = 'A級 - 良好です';
        message = 'おおむね安全な運転ができています。わずかな改善でさらに向上します。';
        advice = '急ブレーキが少ないのは良い傾向です。さらに余裕を持った車間距離を意識すると、よりスムーズになります。';
    } else if (score >= 80) {
        grade = 'B級 - 改善の余地あり';
        message = 'いくつかの急減速・急加速が検出されました。予測運転を心がけましょう。';
        advice = '信号や渋滞を早期に察知して、アクセルを緩める「早めの減速」を意識すると、急ブレーキが減ります。';
    } else if (score >= 70) {
        grade = 'C級 - 注意が必要';
        message = '急ブレーキ・急加速が比較的多く検出されました。運転スタイルの見直しが必要です。';
        advice = '車間距離を十分に保ち、前方の状況を予測して運転してください。焦らず余裕を持った運転が安全性を高めます。';
    } else {
        grade = 'D級 - 大幅な改善が必要';
        message = '急な減速・加速が頻繁に検出されました。安全運転の意識的な改善が求められます。';
        advice = '命を守るために、今すぐ運転スタイルを見直してください。ゆっくりとした発進・減速を心がけ、余裕を持った時間で運転しましょう。';
    }
    
    document.getElementById('autoScoreGrade').textContent = grade;
    document.getElementById('resultMessageAuto').innerHTML = `<p>${message}</p>`;
    document.getElementById('aiAdviceContentAuto').innerHTML = `<p>${advice}</p>`;
}

function retakeAuto() {
    // 状態リセット
    hardBrakeCount = 0;
    hardAccelCount = 0;
    totalDistance = 0;
    lastPosition = null;
    lastTime = null;
    firstFix = false;
    eventsLog = [];
    
    document.getElementById('hardBrakeCount').textContent = '0';
    document.getElementById('hardAccelCount').textContent = '0';
    document.getElementById('currentSpeed').textContent = '0';
    document.getElementById('totalDistance').textContent = '0.000';
    document.getElementById('elapsedTime').textContent = '00:00';
    
    const eventsLogDiv = document.getElementById('eventsLog');
    if (eventsLogDiv) {
        eventsLogDiv.innerHTML = '<p class="events-empty">まだイベントは検出されていません</p>';
    }
    
    const debugEl = document.getElementById('debugInfo');
    if (debugEl) debugEl.textContent = 'GPS信号を検索中...';
    
    document.getElementById('resultContainerAuto').style.display = 'none';
    document.getElementById('detectionContainer').style.display = 'none';
    document.getElementById('permissionContainer').style.display = 'block';
    
    // 画面を上部までスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
