// Глобальные переменные
let isPlaying = false;
let currentTrackIndex = 0;
let currentPhotoIndex = 0;
let audioContext, analyser, source;

// Плейлист
const playlist = {
    'music/1.mp3': 'theqwix - Worthless',
    'music/2.mp3': 'NIKOHA - Armin',
    'music/3.mp3': 'shizocxz - Character', 
    'music/4.mp3': 'MELERY - End of Life'
};

// Локальные фоны
const localBackgrounds =  Array.from({length: 12}, (_, i) => `bg/${i+1}.jpg`);

// Получаем элементы DOM
const preloader = document.getElementById('preloader');
const preloaderProgress = document.getElementById('preloaderProgress');
const preloaderPercent = document.getElementById('preloaderPercent');
const preloaderSpinner = document.getElementById('preloaderSpinner');
const mainContainer = document.getElementById('mainContainer');
const autoplayNotice = document.getElementById('autoplayNotice');
const nowPlaying = document.getElementById('nowPlaying');
const bgImage1 = document.getElementById('bgImage1');
const bgImage2 = document.getElementById('bgImage2');
const audioPlayer = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn');
const playIcon = document.getElementById('playIcon');
const prevTrackBtn = document.getElementById('prevTrackBtn');
const nextTrackBtn = document.getElementById('nextTrackBtn');
const progressBar = document.getElementById('progressBar');
const visualizer = document.getElementById('visualizer');

// Преобразуем плейлист в массив
const playlistArray = Object.keys(playlist).map(file => ({
    file: file,
    name: playlist[file]
}));

// Показываем спиннер загрузки
setTimeout(() => {
    preloaderSpinner.style.opacity = '1';
}, 500);

// Инициализация фона
function initBackground() {
    bgImage1.style.opacity = '0';
    bgImage2.style.opacity = '0';
    setBackground(currentPhotoIndex);
    
    setInterval(() => {
        currentPhotoIndex = (currentPhotoIndex + 1) % localBackgrounds.length;
        setBackground(currentPhotoIndex);
    }, 10000);
}

function setBackground(index) {
    const photoUrl = localBackgrounds[index];
    const currentActive = bgImage1.style.opacity === '1' ? bgImage1 : bgImage2;
    const nextActive = currentActive === bgImage1 ? bgImage2 : bgImage1;
    
    nextActive.style.backgroundImage = `url(${photoUrl})`;
    currentActive.style.opacity = '0';
    nextActive.style.opacity = '1';
}

// Предзагрузка ресурсов
function preloadResources() {
    let loaded = 0;
    const totalResources = playlistArray.length + localBackgrounds.length;
    
    playlistArray.forEach(track => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', track.file, true);
        xhr.onload = () => {
            loaded++;
            updatePreloaderProgress(loaded, totalResources);
        };
        xhr.onerror = () => {
            console.error('Ошибка загрузки:', track.file);
            loaded++;
            updatePreloaderProgress(loaded, totalResources);
        };
        xhr.send();
    });
    
    localBackgrounds.forEach(bgUrl => {
        const img = new Image();
        img.src = bgUrl;
        img.onload = () => {
            loaded++;
            updatePreloaderProgress(loaded, totalResources);
        };
        img.onerror = () => {
            console.error('Ошибка загрузки фона:', bgUrl);
            loaded++;
            updatePreloaderProgress(loaded, totalResources);
        };
    });
    
    initBackground();
}

// Обновление прогресса загрузки
function updatePreloaderProgress(loaded, total) {
    const progress = Math.floor((loaded / total) * 100);
    preloaderProgress.style.width = `${progress}%`;
    preloaderPercent.textContent = `${progress}%`;
    
    if (loaded === total) {
        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
                mainContainer.classList.add('loaded');
                initPlayer();
                tryAutoplay();
            }, 500);
        }, 500);
    }
}

// Инициализация плеера
function initPlayer() {
    setTrack(currentTrackIndex);
    
    audioPlayer.addEventListener('ended', () => {
        nextTrack();
        if (isPlaying) {
            audioPlayer.play().catch(console.error);
        }
    });
}

// Установка трека
function setTrack(index) {
    currentTrackIndex = index % playlistArray.length;
    const track = playlistArray[currentTrackIndex];
    
    audioPlayer.src = track.file;
    nowPlaying.textContent = track.name;
    
    if (isPlaying) {
        audioPlayer.play().catch(error => {
            console.error('Ошибка воспроизведения:', error);
        });
    }
}

// Предыдущий трек
function prevTrack() {
    setTrack(currentTrackIndex - 1);
    if (isPlaying) {
        audioPlayer.play().catch(console.error);
    }
}

// Следующий трек
function nextTrack() {
    setTrack(currentTrackIndex + 1);
    if (isPlaying) {
        audioPlayer.play().catch(console.error);
    }
}

// Переключение воспроизведения
function togglePlay() {
    if (isPlaying) {
        audioPlayer.pause();
        playIcon.classList.replace('fa-pause', 'fa-play');
        isPlaying = false;
    } else {
        audioPlayer.play()
            .then(() => {
                playIcon.classList.replace('fa-play', 'fa-pause');
                isPlaying = true;
            })
            .catch(error => {
                console.error('Ошибка:', error);
                showAutoplayNotice();
            });
    }
}

// Попытка автовоспроизведения
function tryAutoplay() {
    autoplayNotice.classList.add('show');
    
    const playPromise = audioPlayer.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            isPlaying = true;
            playIcon.classList.replace('fa-play', 'fa-pause');
            autoplayNotice.classList.remove('show');
        }).catch(() => {
            showAutoplayNotice();
        });
    }
}

// Показать уведомление
function showAutoplayNotice() {
    autoplayNotice.classList.add('show');
    setTimeout(() => {
        autoplayNotice.classList.remove('show');
    }, 3000);
}

// Обновление прогресс-бара
audioPlayer.addEventListener('timeupdate', () => {
    const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressBar.style.width = `${progress}%`;
});

// Клик по прогресс-бару
document.querySelector('.music-progress').addEventListener('click', (e) => {
    const rect = e.target.getBoundingClientRect();
    const seekTime = (e.clientX - rect.left) / rect.width * audioPlayer.duration;
    audioPlayer.currentTime = seekTime;
});

// Инициализация визуализатора
function initVisualizer() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    source = audioContext.createMediaElementSource(audioPlayer);
    
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    analyser.fftSize = 64;
    
    for (let i = 0; i < 20; i++) {
        const bar = document.createElement('div');
        bar.className = 'visualizer-bar';
        bar.style.left = `${i * 5}%`;
        visualizer.appendChild(bar);
    }
    
    const bars = document.querySelectorAll('.visualizer-bar');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    function updateVisualizer() {
        requestAnimationFrame(updateVisualizer);
        analyser.getByteFrequencyData(dataArray);
        
        bars.forEach((bar, i) => {
            const height = dataArray[Math.floor(i * 2.5)] / 2;
            bar.style.height = `${height}px`;
            bar.style.opacity = height > 0 ? '0.8' : '0';
        });
    }
    
    audioPlayer.addEventListener('play', () => {
        audioContext.resume().then(updateVisualizer);
    });
}

const titleParts = ["fldzme", "fldz me", "f l d z m e"];
const icons = ["⚡", "❤️", "✨", "🌟"];
let currentIndex = 0;

function animateTitle() {
    const icon = icons[Math.floor(Math.random() * icons.length)];
    document.title = `${icon} ${titleParts[currentIndex]} ${icon}`;
    currentIndex = (currentIndex + 1) % titleParts.length;
}

setInterval(animateTitle, 1000);

// Назначение обработчиков событий
playBtn.addEventListener('click', togglePlay);
prevTrackBtn.addEventListener('click', prevTrack);
nextTrackBtn.addEventListener('click', nextTrack);

// Запуск при загрузке страницы
window.addEventListener('load', () => {
    preloadResources();
    initVisualizer();
});