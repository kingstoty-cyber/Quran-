/**
 * التطبيق الرئيسي للقرآن الكريم - النسخة المنقحة
 * إصدار مستقر مع جميع الوظائف المطلوبة
 */

class QuranApp {
    constructor(options = {}) {
        this.config = window.QuranConfig || {};
        this.state = {
            currentPage: 'home',
            currentSurah: null,
            currentReciter: null,
            theme: 'fateha',
            settings: null,
            userData: null,
            isOnline: true,
            isPlaying: false,
            isLoading: false,
            isFullscreen: false,
            audioVolume: 0.8,
            audioSpeed: 1.0,
            searchQuery: '',
            selectedReciters: new Set(),
            selectedSurahs: new Set(),
            bookmarks: [],
            favorites: [],
            downloads: [],
            achievements: [],
            listeningStats: {
                totalSeconds: 0,
                todaySeconds: 0,
                weekSeconds: 0,
                lastUpdated: null
            }
        };
        
        this.components = {};
        this.modules = {};
        this.listeners = {};
        this.pageComponents = {};
        this.currentTrack = null;
        
        this.init(options);
    }
    
    async init(options = {}) {
        console.log('🚀 بدء تشغيل تطبيق القرآن الكريم...');
        
        try {
            // عرض شاشة التحميل
            if (window.utils && window.utils.loading) {
                window.utils.loading.show('جاري تحميل القرآن الكريم...');
            }
            
            // تهيئة الأدوات
            if (window.utils) {
                if (typeof window.utils.init === 'function') {
                    window.utils.init();
                }
            }
            
            // تهيئة المكونات
            if (window.components) {
                if (typeof window.components.init === 'function') {
                    window.components.init();
                }
            }
            
            // تحميل البيانات الأولية
            await this.loadInitialData();
            
            // تهيئة واجهة المستخدم
            await this.initUI();
            
            // تهيئة الأحداث
            this.initEvents();
            
            // استعادة الحالة السابقة
            await this.restoreState();
            
            // إخفاء شاشة التحميل
            setTimeout(() => {
                if (window.utils && window.utils.loading) {
                    window.utils.loading.hide();
                }
                
                // عرض إشعار ترحيبي
                if (window.utils && window.utils.notification) {
                    window.utils.notification.success(
                        `مرحباً بك في القرآن الكريم<br>النسخة 2.0.0`,
                        3000
                    );
                }
                
                console.log('🎉 تم تشغيل تطبيق القرآن الكريم بنجاح');
            }, 1000);
            
        } catch (error) {
            console.error('❌ خطأ في تهيئة التطبيق:', error);
            this.showError('تعذر تحميل التطبيق', error.message);
        }
    }
    
    // ===== تحميل البيانات =====
    async loadInitialData() {
        // تحميل الإعدادات
        this.state.settings = this.loadSettings();
        
        // تحميل بيانات المستخدم
        this.state.userData = this.loadUserData();
        
        // حالة الاتصال
        this.state.isOnline = navigator.onLine;
        
        // تطبيق السمة
        this.setTheme(this.state.settings.theme);
        
        // تعيين القارئ الافتراضي
        if (!this.state.currentReciter) {
            const defaultReciter = this.getReciter(this.state.settings.defaultReciter || 'afs');
            this.state.currentReciter = defaultReciter;
        }
        
        // تحميل الإشارات المرجعية
        this.state.bookmarks = this.loadFromStorage('bookmarks') || [];
        
        // تحميل المفضلة
        this.state.favorites = this.loadFromStorage('favorites') || [1, 36, 55, 67, 112, 113, 114];
        
        // تحميل الإنجازات
        this.state.achievements = this.loadFromStorage('achievements') || [];
        
        // تحميل إحصائيات الاستماع
        this.state.listeningStats = this.loadFromStorage('listening_stats') || {
            totalSeconds: 0,
            todaySeconds: 0,
            weekSeconds: 0,
            lastUpdated: new Date().toISOString()
        };
        
        // تحميل التحميلات
        this.state.downloads = this.loadFromStorage('downloaded_files') || [];
    }
    
    loadSettings() {
        let settings = this.loadFromStorage('settings');
        
        if (!settings) {
            settings = {
                theme: 'fateha',
                audioQuality: 'medium',
                autoPlay: false,
                keepAwake: false,
                fontSize: 'medium',
                playbackSpeed: 1.0,
                notifications: true,
                repeatMode: 'none',
                defaultReciter: 'afs',
                downloadQuality: 'medium',
                dailyReminder: true
            };
            this.saveToStorage('settings', settings);
        }
        
        return settings;
    }
    
    loadUserData() {
        let userData = this.loadFromStorage('user_data');
        
        if (!userData) {
            userData = {
                id: this.generateId(),
                name: 'مستخدم القرآن',
                level: 1,
                experience: 0,
                streak: 0,
                achievements: [],
                createdAt: new Date().toISOString(),
                lastActive: new Date().toISOString()
            };
            this.saveToStorage('user_data', userData);
        }
        
        return userData;
    }
    
    // ===== تهيئة واجهة المستخدم =====
    async initUI() {
        const appElement = document.getElementById('app');
        if (!appElement) {
            throw new Error('عنصر التطبيق غير موجود');
        }
        
        // إنشاء الهيكل الأساسي
        appElement.innerHTML = `
            <!-- حاوية الإشعارات -->
            <div class="notification-container"></div>
            
            <!-- الهيدر -->
            <header class="header">
                <div class="header-content">
                    <a href="#" class="logo" id="logo-home">
                        <div class="logo-icon">🕌</div>
                        <div class="logo-text">
                            القرآن الكريم
                            <span class="logo-subtitle">استمع، اقرأ، احفظ</span>
                        </div>
                    </a>
                    <div class="header-actions">
                        <button class="btn btn-icon" id="theme-toggle">
                            <i class="fas fa-palette"></i>
                        </button>
                        <button class="btn btn-icon" id="fullscreen-toggle">
                            <i class="fas fa-expand"></i>
                        </button>
                        <button class="btn btn-icon" id="settings-btn">
                            <i class="fas fa-cog"></i>
                        </button>
                    </div>
                </div>
            </header>
            
            <!-- شريط التنقل الرئيسي -->
            <nav class="main-nav" id="main-nav"></nav>
            
            <!-- المحتوى الرئيسي -->
            <main class="main-content">
                <div class="section active" id="home-section"></div>
                <div class="section" id="listen-section"></div>
                <div class="section" id="read-section"></div>
                <div class="section" id="memorize-section"></div>
                <div class="section" id="download-section"></div>
                <div class="section" id="bookmarks-section"></div>
                <div class="section" id="statistics-section"></div>
                <div class="section" id="settings-section"></div>
            </main>
            
            <!-- مشغل الصوت -->
            <div class="audio-player" id="audio-player">
                <div class="player-header">
                    <div class="player-info">
                        <div class="player-title" id="player-title">...</div>
                        <div class="player-subtitle" id="player-subtitle">...</div>
                    </div>
                    <button class="btn btn-icon" id="close-player">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="progress-container">
                    <div class="progress-bar" id="progress-bar">
                        <div class="progress-fill" id="progress-fill"></div>
                    </div>
                    <div class="progress-time">
                        <span id="current-time">0:00</span>
                        <span id="duration">0:00</span>
                    </div>
                </div>
                <div class="player-controls">
                    <button class="control-btn" id="prev-btn">
                        <i class="fas fa-step-backward"></i>
                    </button>
                    <button class="control-btn play" id="play-pause-btn">
                        <i class="fas fa-play" id="play-icon"></i>
                    </button>
                    <button class="control-btn" id="next-btn">
                        <i class="fas fa-step-forward"></i>
                    </button>
                    <button class="control-btn" id="repeat-btn">
                        <i class="fas fa-redo"></i>
                    </button>
                    <button class="control-btn" id="volume-btn">
                        <i class="fas fa-volume-up"></i>
                    </button>
                </div>
            </div>
            
            <!-- شريط التنقل السفلي -->
            <nav class="bottom-nav" id="bottom-nav"></nav>
            
            <!-- شاشة التحميل -->
            <div class="loading-overlay" id="global-loading">
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">جاري التحميل...</div>
                </div>
            </div>
        `;
        
        // إضافة الأحداث للأزرار العامة
        this.setupGlobalEvents();
        
        // تهيئة شريط التنقل الرئيسي
        this.initMainNav();
        
        // تهيئة شريط التنقل السفلي
        this.initBottomNav();
        
        // إخفاء المشغل في البداية
        this.hidePlayer();
        
        // عرض الصفحة الرئيسية
        this.showPage('home');
    }
    
    setupGlobalEvents() {
        // زر الصفحة الرئيسية
        document.getElementById('logo-home').addEventListener('click', (e) => {
            e.preventDefault();
            this.showPage('home');
        });
        
        // تبديل السمة
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // وضع الملء الشاشة
        document.getElementById('fullscreen-toggle').addEventListener('click', () => {
            this.toggleFullscreen();
        });
        
        // زر الإعدادات
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showPage('settings');
        });
        
        // أزرار المشغل
        document.getElementById('close-player').addEventListener('click', () => {
            this.hidePlayer();
        });
        
        document.getElementById('play-pause-btn').addEventListener('click', () => {
            this.togglePlayPause();
        });
        
        document.getElementById('prev-btn').addEventListener('click', () => {
            this.prevTrack();
        });
        
        document.getElementById('next-btn').addEventListener('click', () => {
            this.nextTrack();
        });
        
        document.getElementById('repeat-btn').addEventListener('click', () => {
            this.toggleRepeat();
        });
        
        document.getElementById('volume-btn').addEventListener('click', () => {
            this.toggleMute();
        });
        
        // شريط التقدم
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.addEventListener('click', (e) => {
                this.seekAudio(e);
            });
        }
    }
    
    initMainNav() {
        const navElement = document.getElementById('main-nav');
        if (!navElement) return;
        
        const pages = [
            { id: 'home', name: 'الرئيسية', icon: 'fas fa-home' },
            { id: 'listen', name: 'الاستماع', icon: 'fas fa-headphones' },
            { id: 'read', name: 'القراءة', icon: 'fas fa-book-open' },
            { id: 'memorize', name: 'الحفظ', icon: 'fas fa-brain' },
            { id: 'download', name: 'التحميل', icon: 'fas fa-download' },
            { id: 'bookmarks', name: 'الإشارات', icon: 'fas fa-bookmark' },
            { id: 'statistics', name: 'الإحصاءات', icon: 'fas fa-chart-bar' },
            { id: 'settings', name: 'الإعدادات', icon: 'fas fa-cog' }
        ];
        
        navElement.innerHTML = '';
        
        pages.forEach(page => {
            const button = document.createElement('button');
            button.className = `nav-item ${this.state.currentPage === page.id ? 'active' : ''}`;
            button.setAttribute('data-page', page.id);
            button.innerHTML = `
                <i class="${page.icon}"></i>
                <span>${page.name}</span>
            `;
            button.addEventListener('click', () => this.showPage(page.id));
            navElement.appendChild(button);
        });
    }
    
    initBottomNav() {
        const bottomNav = document.getElementById('bottom-nav');
        if (!bottomNav) return;
        
        const items = [
            { id: 'home', name: 'الرئيسية', icon: 'fas fa-home' },
            { id: 'listen', name: 'استماع', icon: 'fas fa-headphones' },
            { id: 'read', name: 'قراءة', icon: 'fas fa-book-open' },
            { id: 'memorize', name: 'حفظ', icon: 'fas fa-brain' },
            { id: 'download', name: 'تحميل', icon: 'fas fa-download' }
        ];
        
        bottomNav.innerHTML = '';
        
        items.forEach(item => {
            const button = document.createElement('button');
            button.className = `nav-btn ${this.state.currentPage === item.id ? 'active' : ''}`;
            button.setAttribute('data-item', item.id);
            button.innerHTML = `
                <i class="nav-icon ${item.icon}"></i>
                <span class="nav-text">${item.name}</span>
            `;
            button.addEventListener('click', () => this.showPage(item.id));
            bottomNav.appendChild(button);
        });
    }
    
    // ===== إدارة الصفحات =====
    showPage(pageId) {
        // إخفاء جميع الصفحات
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // تحديث الحالة
        this.state.currentPage = pageId;
        
        // تحديث أزرار التنقل النشطة
        this.updateActiveNavItems(pageId);
        
        // إخفاء شريط التنقل السفلي في بعض الصفحات
        const bottomNav = document.getElementById('bottom-nav');
        if (bottomNav) {
            bottomNav.style.display = ['settings', 'bookmarks', 'statistics'].includes(pageId) ? 'none' : 'flex';
        }
        
        // عرض الصفحة المطلوبة
        const sectionId = `${pageId}-section`;
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('active');
            this.renderPageContent(pageId, section);
        }
        
        // إغلاق المشغل في بعض الصفحات
        if (pageId !== 'listen') {
            this.hidePlayer();
        }
        
        // إرسال حدث تغيير الصفحة
        this.emit('pagechange', { page: pageId });
    }
    
    updateActiveNavItems(pageId) {
        // شريط التنقل الرئيسي
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-page') === pageId) {
                item.classList.add('active');
            }
        });
        
        // شريط التنقل السفلي
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-item') === pageId) {
                btn.classList.add('active');
            }
        });
    }
    
    renderPageContent(pageId, container) {
        container.innerHTML = '';
        
        switch(pageId) {
            case 'home':
                this.renderHomePage(container);
                break;
            case 'listen':
                this.renderListenPage(container);
                break;
            case 'download':
                this.renderDownloadPage(container);
                break;
            case 'settings':
                this.renderSettingsPage(container);
                break;
            default:
                this.renderComingSoonPage(container, pageId);
                break;
        }
    }
    
    // ===== صفحة الرئيسية =====
    renderHomePage(container) {
        container.innerHTML = `
            <div class="section-header">
                <h1 class="section-title">
                    <i class="fas fa-quran"></i>
                    القرآن الكريم
                </h1>
                <p class="section-subtitle">تطبيق القرآن الشامل - استمع، اقرأ، احفظ، وحمل</p>
            </div>
            
            <div class="stats-grid" id="home-stats"></div>
            
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">
                        <i class="fas fa-star"></i>
                        المميزات الرئيسية
                    </h2>
                </div>
                <div class="features-grid" id="features-grid"></div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">
                        <i class="fas fa-fire"></i>
                        النشاط الأخير
                    </h2>
                    <button class="btn btn-secondary" id="clear-activity">
                        مسح النشاط
                    </button>
                </div>
                <div class="recent-activity" id="recent-activity"></div>
            </div>
            
            <div class="quick-actions">
                <button class="btn btn-primary btn-large" id="quick-listen">
                    <i class="fas fa-play-circle"></i>
                    استمع الآن
                </button>
                <button class="btn btn-secondary btn-large" id="quick-read">
                    <i class="fas fa-book-open"></i>
                    اقرأ القرآن
                </button>
                <button class="btn btn-outline btn-large" id="quick-download">
                    <i class="fas fa-download"></i>
                    حمل للاستماع بدون نت
                </button>
            </div>
        `;
        
        // عرض الإحصائيات
        this.renderHomeStats();
        
        // عرض المميزات
        this.renderFeatures();
        
        // عرض النشاط الأخير
        this.renderRecentActivity();
        
        // إضافة الأحداث
        document.getElementById('clear-activity').addEventListener('click', () => {
            this.clearRecentActivity();
        });
        
        document.getElementById('quick-listen').addEventListener('click', () => {
            this.quickListen();
        });
        
        document.getElementById('quick-read').addEventListener('click', () => {
            this.showPage('read');
        });
        
        document.getElementById('quick-download').addEventListener('click', () => {
            this.showPage('download');
        });
    }
    
    renderHomeStats() {
        const container = document.getElementById('home-stats');
        if (!container) return;
        
        const listeningHours = Math.floor(this.state.listeningStats.totalSeconds / 3600);
        
        const stats = [
            { value: this.state.favorites.length, label: 'السور المفضلة' },
            { value: this.state.bookmarks.length, label: 'الإشارات المرجعية' },
            { value: listeningHours, label: 'ساعات استماع' },
            { value: this.state.userData.streak, label: 'أيام متابعة' }
        ];
        
        container.innerHTML = stats.map(stat => `
            <div class="stat-card">
                <div class="stat-number">${stat.value}</div>
                <div class="stat-label">${stat.label}</div>
            </div>
        `).join('');
    }
    
    renderFeatures() {
        const container = document.getElementById('features-grid');
        if (!container) return;
        
        const features = [
            {
                id: 1,
                title: "الاستماع للقرآن",
                description: "استمع للقرآن الكريم بصوت أشهر القراء",
                icon: "fas fa-headphones",
                color: "#1a5f23"
            },
            {
                id: 2,
                title: "قراءة القرآن",
                description: "اقرأ القرآن الكريم بتلاوة سليمة",
                icon: "fas fa-book-open",
                color: "#2980b9"
            },
            {
                id: 3,
                title: "برنامج الحفظ",
                description: "احفظ القرآن الكريم بخطة منظمة",
                icon: "fas fa-brain",
                color: "#8e44ad"
            },
            {
                id: 4,
                title: "تحميل القرآن",
                description: "حمل القرآن الكريم للاستماع بدون إنترنت",
                icon: "fas fa-download",
                color: "#c0392b"
            },
            {
                id: 5,
                title: "الإشارات المرجعية",
                description: "احتفظ بمواضعك المفضلة في القرآن",
                icon: "fas fa-bookmark",
                color: "#f39c12"
            },
            {
                id: 6,
                title: "الإحصاءات",
                description: "تابع تقدمك في حفظ وقراءة القرآن",
                icon: "fas fa-chart-bar",
                color: "#16a085"
            }
        ];
        
        container.innerHTML = features.map(feature => `
            <div class="feature-card" data-feature="${feature.id}">
                <div class="feature-icon" style="background: ${feature.color}">
                    <i class="${feature.icon}"></i>
                </div>
                <h3 class="feature-title">${feature.title}</h3>
                <p class="feature-description">${feature.description}</p>
                <button class="btn btn-outline feature-btn">ابدأ الآن</button>
            </div>
        `).join('');
        
        // إضافة الأحداث للمميزات
        container.querySelectorAll('.feature-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn')) {
                    const featureId = parseInt(card.getAttribute('data-feature'));
                    this.openFeature(featureId);
                }
            });
        });
    }
    
    renderRecentActivity() {
        const container = document.getElementById('recent-activity');
        if (!container) return;
        
        let activity = this.loadFromStorage('recent_activity') || [];
        
        if (activity.length === 0) {
            activity = [
                {
                    type: 'listen',
                    title: 'استمعت إلى سورة يس',
                    time: 'منذ 5 دقائق',
                    icon: 'fas fa-headphones'
                },
                {
                    type: 'read',
                    title: 'قرأت صفحة 45',
                    time: 'منذ ساعة',
                    icon: 'fas fa-book-open'
                },
                {
                    type: 'memorize',
                    title: 'حفظت آية من سورة الرحمن',
                    time: 'منذ يوم',
                    icon: 'fas fa-brain'
                }
            ];
        }
        
        container.innerHTML = activity.map(item => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="${item.icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${item.title}</div>
                    <div class="activity-time">${item.time}</div>
                </div>
            </div>
        `).join('');
    }
    
    // ===== صفحة الاستماع =====
    renderListenPage(container) {
        container.innerHTML = `
            <div class="section-header">
                <h1 class="section-title">
                    <i class="fas fa-headphones"></i>
                    الاستماع للقرآن
                </h1>
                <div class="header-actions">
                    <div class="search-box">
                        <input type="text" class="search-input" id="surah-search" 
                               placeholder="ابحث عن سورة...">
                        <i class="fas fa-search search-icon"></i>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">
                        <i class="fas fa-users"></i>
                        اختر القارئ
                    </h2>
                    <select class="form-control" id="reciter-filter" style="width: 200px;">
                        <option value="all">جميع القراء</option>
                        <option value="مجود">مجود</option>
                        <option value="مرتل">مرتل</option>
                        <option value="السعودية">السعودية</option>
                        <option value="مصر">مصر</option>
                    </select>
                </div>
                <div class="reciters-grid" id="reciters-grid"></div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">
                        <i class="fas fa-list"></i>
                        قائمة السور
                    </h2>
                    <div class="card-actions">
                        <button class="btn btn-secondary" id="sort-number">
                            <i class="fas fa-sort-numeric-down"></i>
                        </button>
                        <button class="btn btn-secondary" id="sort-name">
                            <i class="fas fa-sort-alpha-down"></i>
                        </button>
                        <button class="btn btn-secondary" id="filter-makki">
                            مكية
                        </button>
                        <button class="btn btn-secondary" id="filter-madani">
                            مدنية
                        </button>
                    </div>
                </div>
                <div class="surah-list" id="surah-list"></div>
            </div>
        `;
        
        // عرض القراء
        this.renderReciters();
        
        // عرض السور
        this.renderSurahs();
        
        // إضافة الأحداث
        this.setupListenPageEvents();
    }
    
    renderReciters() {
        const container = document.getElementById('reciters-grid');
        if (!container) return;
        
        // استخدام البيانات المتاحة
        const reciters = window.RECITERS ? window.RECITERS.slice(0, 12) : this.getSampleReciters();
        
        container.innerHTML = reciters.map(reciter => `
            <div class="reciter-card ${this.state.currentReciter?.id === reciter.id ? 'active' : ''}" 
                 data-reciter="${reciter.id}">
                <div class="reciter-avatar" style="background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light))">
                    ${reciter.name.charAt(0)}
                </div>
                <h3 class="reciter-name">${reciter.name}</h3>
                <div class="reciter-info">
                    <span class="reciter-country">${reciter.country || 'غير معروف'}</span>
                    <span class="reciter-style">${reciter.style || 'غير معروف'}</span>
                </div>
                <div class="reciter-stats">
                    <div class="reciter-stat">
                        <div class="reciter-stat-value">${reciter.popularity || 80}%</div>
                        <div class="reciter-stat-label">شعبية</div>
                    </div>
                    <div class="reciter-stat">
                        <div class="reciter-stat-value">${reciter.quality || 'عالية'}</div>
                        <div class="reciter-stat-label">جودة</div>
                    </div>
                </div>
                <button class="btn btn-primary btn-small btn-play-reciter">
                    <i class="fas fa-play"></i>
                    استمع
                </button>
            </div>
        `).join('');
        
        // إضافة الأحداث للقراء
        container.querySelectorAll('.reciter-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn')) {
                    const reciterId = card.getAttribute('data-reciter');
                    this.selectReciter(reciterId);
                }
            });
        });
        
        // أزرار التشغيل
        container.querySelectorAll('.btn-play-reciter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = btn.closest('.reciter-card');
                const reciterId = card.getAttribute('data-reciter');
                this.playReciter(reciterId);
            });
        });
    }
    
    renderSurahs() {
        const container = document.getElementById('surah-list');
        if (!container) return;
        
        // استخدام البيانات المتاحة
        const surahs = window.SURAH_DATA ? window.SURAH_DATA : this.getSampleSurahs();
        
        container.innerHTML = surahs.map(surah => `
            <div class="surah-card ${this.state.favorites.includes(surah.number) ? 'favorite' : ''}" 
                 data-surah="${surah.number}">
                <div class="surah-number">${surah.number}</div>
                <div class="surah-content">
                    <h3 class="surah-name">${surah.name}</h3>
                    <div class="surah-meta">
                        <span class="surah-ayas">${surah.ayas} آية</span>
                        <span class="surah-type">${surah.type}</span>
                        <span class="surah-pages">ص ${surah.pages[0]}-${surah.pages[1]}</span>
                    </div>
                </div>
                <div class="surah-actions">
                    <button class="btn btn-icon btn-favorite" data-surah="${surah.number}">
                        <i class="fas fa-heart ${this.state.favorites.includes(surah.number) ? 'active' : ''}"></i>
                    </button>
                    <button class="btn btn-icon btn-info" data-surah="${surah.number}">
                        <i class="fas fa-info-circle"></i>
                    </button>
                    <button class="btn btn-icon btn-play" data-surah="${surah.number}">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // إضافة الأحداث للسور
        this.setupSurahEvents();
    }
    
    setupListenPageEvents() {
        // البحث
        const searchInput = document.getElementById('surah-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchSurahs(e.target.value);
            });
        }
        
        // تصفية القراء
        const reciterFilter = document.getElementById('reciter-filter');
        if (reciterFilter) {
            reciterFilter.addEventListener('change', (e) => {
                this.filterReciters(e.target.value);
            });
        }
        
        // فرز السور
        document.getElementById('sort-number').addEventListener('click', () => {
            this.sortSurahs('number');
        });
        
        document.getElementById('sort-name').addEventListener('click', () => {
            this.sortSurahs('name');
        });
        
        // تصفية السور
        document.getElementById('filter-makki').addEventListener('click', () => {
            this.filterSurahs('مكية');
        });
        
        document.getElementById('filter-madani').addEventListener('click', () => {
            this.filterSurahs('مدنية');
        });
    }
    
    setupSurahEvents() {
        // التشغيل
        document.querySelectorAll('.btn-play').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const surahNumber = parseInt(btn.getAttribute('data-surah'));
                this.playSurah(surahNumber);
            });
        });
        
        // المفضلة
        document.querySelectorAll('.btn-favorite').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const surahNumber = parseInt(btn.getAttribute('data-surah'));
                this.toggleFavorite(surahNumber);
            });
        });
        
        // المعلومات
        document.querySelectorAll('.btn-info').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const surahNumber = parseInt(btn.getAttribute('data-surah'));
                this.showSurahInfo(surahNumber);
            });
        });
        
        // النقر على السورة
        document.querySelectorAll('.surah-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn')) {
                    const surahNumber = parseInt(card.getAttribute('data-surah'));
                    this.playSurah(surahNumber);
                }
            });
        });
    }
    
    // ===== صفحة التحميل =====
    renderDownloadPage(container) {
        container.innerHTML = `
            <div class="section-header">
                <h1 class="section-title">
                    <i class="fas fa-download"></i>
                    تحميل القرآن
                </h1>
                <div class="storage-info">
                    <div class="progress-container" style="width: 200px;">
                        <div class="progress-bar">
                            <div class="progress-fill" id="storage-fill"></div>
                        </div>
                        <div class="progress-percentage" id="storage-percentage">0%</div>
                    </div>
                    <span id="storage-text">0 MB من 1000 MB</span>
                </div>
            </div>
            
            <div class="download-options-grid" id="download-options"></div>
            
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">
                        <i class="fas fa-list"></i>
                        الملفات المحملة
                    </h2>
                    <button class="btn btn-danger" id="clear-downloads">
                        <i class="fas fa-trash"></i>
                        مسح الكل
                    </button>
                </div>
                <div class="downloads-list" id="downloads-list"></div>
            </div>
        `;
        
        // عرض خيارات التحميل
        this.renderDownloadOptions();
        
        // عرض الملفات المحملة
        this.renderDownloadsList();
        
        // تحديث معلومات التخزين
        this.updateStorageInfo();
        
        // إضافة الأحداث
        this.setupDownloadPageEvents();
    }
    
    renderDownloadOptions() {
        const container = document.getElementById('download-options');
        if (!container) return;
        
        const options = [
            {
                id: 'all',
                title: 'تحميل الكل',
                description: 'تحميل جميع سور القرآن الكريم',
                icon: 'fas fa-cloud-download-alt',
                color: '#1a5f23'
            },
            {
                id: 'selective',
                title: 'اختيار السور',
                description: 'اختر السور التي تريد تحميلها',
                icon: 'fas fa-check-circle',
                color: '#2980b9'
            },
            {
                id: 'juz',
                title: 'تحميل أجزاء',
                description: 'تحميل أجزاء محددة من القرآن',
                icon: 'fas fa-layer-group',
                color: '#8e44ad'
            },
            {
                id: 'favorites',
                title: 'السور المفضلة',
                description: 'تحميل السور المفضلة فقط',
                icon: 'fas fa-heart',
                color: '#c0392b'
            }
        ];
        
        container.innerHTML = options.map(option => `
            <div class="download-option" data-option="${option.id}">
                <div class="download-option-icon" style="background: ${option.color}">
                    <i class="${option.icon}"></i>
                </div>
                <h3 class="download-option-title">${option.title}</h3>
                <p class="download-option-description">${option.description}</p>
                <button class="btn btn-primary">اختر</button>
            </div>
        `).join('');
        
        // إضافة الأحداث
        container.querySelectorAll('.download-option').forEach(option => {
            option.addEventListener('click', () => {
                const optionId = option.getAttribute('data-option');
                this.selectDownloadOption(optionId);
            });
        });
    }
    
    renderDownloadsList() {
        const container = document.getElementById('downloads-list');
        if (!container) return;
        
        const downloads = this.state.downloads;
        
        if (downloads.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-download"></i>
                    </div>
                    <h3 class="empty-state-title">لا توجد ملفات محملة</h3>
                    <p class="empty-state-description">قم بتحميل السور للاستماع بدون إنترنت</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = downloads.map(file => `
            <div class="download-item">
                <div class="download-info">
                    <div class="download-name">${file.surah?.name || 'غير معروف'}</div>
                    <div class="download-meta">
                        <span class="download-reciter">${file.reciter?.name || 'غير معروف'}</span>
                        <span class="download-quality">${file.quality || 'متوسطة'}</span>
                        <span class="download-size">${this.formatFileSize(file.size || 0)}</span>
                    </div>
                </div>
                <div class="download-actions">
                    <button class="btn btn-icon btn-play-download" data-id="${file.id}">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="btn btn-icon btn-delete-download" data-id="${file.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // إضافة الأحداث
        this.setupDownloadsListEvents();
    }
    
    setupDownloadPageEvents() {
        // مسح التحميلات
        document.getElementById('clear-downloads').addEventListener('click', () => {
            this.clearDownloads();
        });
    }
    
    setupDownloadsListEvents() {
        // تشغيل الملف المحمل
        document.querySelectorAll('.btn-play-download').forEach(btn => {
            btn.addEventListener('click', () => {
                const fileId = btn.getAttribute('data-id');
                this.playDownloaded(fileId);
            });
        });
        
        // حذف الملف المحمل
        document.querySelectorAll('.btn-delete-download').forEach(btn => {
            btn.addEventListener('click', () => {
                const fileId = btn.getAttribute('data-id');
                this.deleteDownloaded(fileId);
            });
        });
    }
    
    // ===== صفحة الإعدادات =====
    renderSettingsPage(container) {
        container.innerHTML = `
            <div class="section-header">
                <h1 class="section-title">
                    <i class="fas fa-cog"></i>
                    الإعدادات
                </h1>
            </div>
            
            <div class="settings-grid">
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">
                            <i class="fas fa-palette"></i>
                            المظهر
                        </h2>
                    </div>
                    <div class="themes-grid" id="themes-grid"></div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">
                            <i class="fas fa-volume-up"></i>
                            الصوت
                        </h2>
                    </div>
                    <div class="settings-section">
                        <label class="form-label">جودة الصوت</label>
                        <select class="form-control" id="audio-quality">
                            <option value="high" ${this.state.settings.audioQuality === 'high' ? 'selected' : ''}>عالية (128kbps)</option>
                            <option value="medium" ${this.state.settings.audioQuality === 'medium' ? 'selected' : ''}>متوسطة (64kbps)</option>
                            <option value="low" ${this.state.settings.audioQuality === 'low' ? 'selected' : ''}>منخفضة (32kbps)</option>
                        </select>
                    </div>
                    <div class="settings-section">
                        <label class="form-label">سرعة التشغيل</label>
                        <select class="form-control" id="playback-speed">
                            <option value="0.5" ${this.state.audioSpeed === 0.5 ? 'selected' : ''}>0.5x</option>
                            <option value="0.75" ${this.state.audioSpeed === 0.75 ? 'selected' : ''}>0.75x</option>
                            <option value="1.0" ${this.state.audioSpeed === 1.0 ? 'selected' : ''}>1.0x عادية</option>
                            <option value="1.25" ${this.state.audioSpeed === 1.25 ? 'selected' : ''}>1.25x</option>
                            <option value="1.5" ${this.state.audioSpeed === 1.5 ? 'selected' : ''}>1.5x</option>
                            <option value="2.0" ${this.state.audioSpeed === 2.0 ? 'selected' : ''}>2.0x</option>
                        </select>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">
                            <i class="fas fa-book"></i>
                            القراءة
                        </h2>
                    </div>
                    <div class="settings-section">
                        <label class="form-label">حجم الخط</label>
                        <select class="form-control" id="font-size">
                            <option value="small" ${this.state.settings.fontSize === 'small' ? 'selected' : ''}>صغير</option>
                            <option value="medium" ${this.state.settings.fontSize === 'medium' ? 'selected' : ''}>متوسط</option>
                            <option value="large" ${this.state.settings.fontSize === 'large' ? 'selected' : ''}>كبير</option>
                            <option value="xlarge" ${this.state.settings.fontSize === 'xlarge' ? 'selected' : ''}>كبير جداً</option>
                        </select>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">
                            <i class="fas fa-bell"></i>
                            الإشعارات
                        </h2>
                    </div>
                    <div class="settings-section">
                        <label class="form-checkbox-label">
                            <input type="checkbox" class="form-checkbox" id="notifications-enabled" 
                                   ${this.state.settings.notifications ? 'checked' : ''}>
                            تمكين الإشعارات
                        </label>
                    </div>
                    <div class="settings-section">
                        <label class="form-checkbox-label">
                            <input type="checkbox" class="form-checkbox" id="daily-reminder" 
                                   ${this.state.settings.dailyReminder ? 'checked' : ''}>
                            التذكير اليومي
                        </label>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">
                            <i class="fas fa-database"></i>
                            البيانات
                        </h2>
                    </div>
                    <div class="settings-section">
                        <button class="btn btn-secondary btn-full" id="export-data">
                            <i class="fas fa-file-export"></i>
                            تصدير البيانات
                        </button>
                    </div>
                    <div class="settings-section">
                        <button class="btn btn-secondary btn-full" id="import-data">
                            <i class="fas fa-file-import"></i>
                            استيراد البيانات
                        </button>
                    </div>
                    <div class="settings-section">
                        <button class="btn btn-danger btn-full" id="reset-data">
                            <i class="fas fa-trash"></i>
                            إعادة التعيين
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="app-info">
                <div class="app-version">2.0.0</div>
                <div class="app-copyright">© 2024 تطبيق القرآن الكريم</div>
                <div class="app-author">جميع الحقوق محفوظة</div>
            </div>
        `;
        
        // عرض السمات
        this.renderThemes();
        
        // إضافة الأحداث
        this.setupSettingsPageEvents();
    }
    
    renderThemes() {
        const container = document.getElementById('themes-grid');
        if (!container) return;
        
        const themes = window.THEMES || this.getSampleThemes();
        
        container.innerHTML = themes.map(theme => `
            <div class="theme-option ${this.state.theme === theme.id ? 'active' : ''}" 
                 data-theme="${theme.id}">
                <div class="theme-preview" style="background: ${theme.colors[0] || '#1a5f23'}">
                    <i class="${theme.icon || 'fas fa-mosque'}"></i>
                </div>
                <div class="theme-name">${theme.name}</div>
            </div>
        `).join('');
        
        // إضافة الأحداث للسمات
        container.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                const themeId = option.getAttribute('data-theme');
                this.setTheme(themeId);
            });
        });
    }
    
    setupSettingsPageEvents() {
        // جودة الصوت
        document.getElementById('audio-quality').addEventListener('change', (e) => {
            this.setAudioQuality(e.target.value);
        });
        
        // سرعة التشغيل
        document.getElementById('playback-speed').addEventListener('change', (e) => {
            this.setPlaybackSpeed(e.target.value);
        });
        
        // حجم الخط
        document.getElementById('font-size').addEventListener('change', (e) => {
            this.setFontSize(e.target.value);
        });
        
        // الإشعارات
        document.getElementById('notifications-enabled').addEventListener('change', (e) => {
            this.toggleNotifications(e.target.checked);
        });
        
        // التذكير اليومي
        document.getElementById('daily-reminder').addEventListener('change', (e) => {
            this.toggleDailyReminder(e.target.checked);
        });
        
        // تصدير البيانات
        document.getElementById('export-data').addEventListener('click', () => {
            this.exportData();
        });
        
        // استيراد البيانات
        document.getElementById('import-data').addEventListener('click', () => {
            this.importData();
        });
        
        // إعادة التعيين
        document.getElementById('reset-data').addEventListener('click', () => {
            this.resetData();
        });
    }
    
    // ===== صفحة قيد التطوير =====
    renderComingSoonPage(container, pageName) {
        const pageNames = {
            'read': 'القراءة',
            'memorize': 'الحفظ',
            'bookmarks': 'الإشارات المرجعية',
            'statistics': 'الإحصاءات'
        };
        
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas fa-cogs"></i>
                </div>
                <h3 class="empty-state-title">${pageNames[pageName] || pageName}</h3>
                <p class="empty-state-description">هذه الصفحة قيد التطوير حالياً</p>
                <button class="btn btn-primary" id="back-to-home">
                    العودة للرئيسية
                </button>
            </div>
        `;
        
        document.getElementById('back-to-home').addEventListener('click', () => {
            this.showPage('home');
        });
    }
    
    // ===== الوظائف الأساسية =====
    
    // === إدارة السمات ===
    setTheme(themeId) {
        // إزالة جميع سمات الجسم
        document.body.classList.remove(...Array.from(document.body.classList).filter(c => c.startsWith('theme-')));
        
        // إضافة السمة الجديدة
        document.body.classList.add(`theme-${themeId}`);
        this.state.theme = themeId;
        this.state.settings.theme = themeId;
        
        // حفظ الإعدادات
        this.saveToStorage('settings', this.state.settings);
        
        // تحديث واجهة المستخدم
        this.updateThemeUI(themeId);
        
        // إشعار
        this.showNotification('تم تغيير السمة بنجاح', 'success');
    }
    
    toggleTheme() {
        const themes = window.THEMES || this.getSampleThemes();
        const currentIndex = themes.findIndex(t => t.id === this.state.theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.setTheme(themes[nextIndex].id);
    }
    
    updateThemeUI(themeId) {
        // تحديث خيارات السمات النشطة
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.remove('active');
            if (option.getAttribute('data-theme') === themeId) {
                option.classList.add('active');
            }
        });
    }
    
    // === إدارة القراء ===
    selectReciter(reciterId) {
        const reciters = window.RECITERS || this.getSampleReciters();
        const reciter = reciters.find(r => r.id === reciterId);
        
        if (reciter) {
            this.state.currentReciter = reciter;
            this.state.settings.defaultReciter = reciterId;
            this.saveToStorage('settings', this.state.settings);
            
            // تحديث واجهة المستخدم
            document.querySelectorAll('.reciter-card').forEach(card => {
                card.classList.remove('active');
                if (card.getAttribute('data-reciter') === reciterId) {
                    card.classList.add('active');
                }
            });
            
            this.showNotification(`تم اختيار القارئ: ${reciter.name}`, 'success');
        }
    }
    
    filterReciters(filter) {
        const container = document.getElementById('reciters-grid');
        if (!container) return;
        
        const cards = container.querySelectorAll('.reciter-card');
        
        cards.forEach(card => {
            const style = card.querySelector('.reciter-style')?.textContent || '';
            const country = card.querySelector('.reciter-country')?.textContent || '';
            
            if (filter === 'all' || 
                style.includes(filter) || 
                country.includes(filter)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    playReciter(reciterId) {
        this.selectReciter(reciterId);
        
        // تشغيل سورة عشوائية
        const surahs = window.SURAH_DATA || this.getSampleSurahs();
        const randomSurah = surahs[Math.floor(Math.random() * surahs.length)];
        this.playSurah(randomSurah.number, reciterId);
    }
    
    // === إدارة السور ===
    playSurah(surahNumber, reciterId = null) {
        const surahs = window.SURAH_DATA || this.getSampleSurahs();
        const surah = surahs.find(s => s.number === surahNumber);
        
        const reciter = reciterId ? 
            (window.RECITERS || this.getSampleReciters()).find(r => r.id === reciterId) : 
            this.state.currentReciter;
        
        if (!surah || !reciter) {
            this.showNotification('تعذر العثور على السورة أو القارئ', 'error');
            return;
        }
        
        // إنشاء مسار الصوت
        const track = {
            id: `${surah.number}_${reciter.id}`,
            surah: surah,
            reciter: reciter,
            url: this.generateAudioUrl(reciter.id, surah.number),
            isDownloaded: false
        };
        
        // حفظ المسار الحالي
        this.currentTrack = track;
        
        // عرض المشغل
        this.showPlayer();
        this.updatePlayerInfo(surah, reciter);
        
        // تشغيل الصوت
        this.playAudio(track.url);
        
        // تسجيل النشاط
        this.addActivity('listen', `استمعت إلى سورة ${surah.name}`);
        
        // تحديث إحصائيات الاستماع
        this.updateListeningStats();
    }
    
    searchSurahs(query) {
        const container = document.getElementById('surah-list');
        if (!container) return;
        
        const cards = container.querySelectorAll('.surah-card');
        const searchTerm = query.toLowerCase();
        
        cards.forEach(card => {
            const surahName = card.querySelector('.surah-name')?.textContent.toLowerCase() || '';
            const surahNumber = card.getAttribute('data-surah') || '';
            
            if (surahName.includes(searchTerm) || 
                surahNumber.includes(searchTerm) || 
                query === '') {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    sortSurahs(criteria) {
        const container = document.getElementById('surah-list');
        if (!container) return;
        
        const cards = Array.from(container.querySelectorAll('.surah-card'));
        
        cards.sort((a, b) => {
            if (criteria === 'number') {
                const numA = parseInt(a.getAttribute('data-surah'));
                const numB = parseInt(b.getAttribute('data-surah'));
                return numA - numB;
            } else if (criteria === 'name') {
                const nameA = a.querySelector('.surah-name')?.textContent || '';
                const nameB = b.querySelector('.surah-name')?.textContent || '';
                return nameA.localeCompare(nameB, 'ar');
            }
            return 0;
        });
        
        // إعادة ترتيب البطاقات
        cards.forEach(card => container.appendChild(card));
    }
    
    filterSurahs(type) {
        const container = document.getElementById('surah-list');
        if (!container) return;
        
        const cards = container.querySelectorAll('.surah-card');
        
        cards.forEach(card => {
            const surahType = card.querySelector('.surah-type')?.textContent || '';
            
            if (type === 'all' || surahType === type) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    showSurahInfo(surahNumber) {
        const surahs = window.SURAH_DATA || this.getSampleSurahs();
        const surah = surahs.find(s => s.number === surahNumber);
        
        if (surah) {
            const info = `
                <div class="surah-info-modal">
                    <h3>سورة ${surah.name}</h3>
                    <p>عدد الآيات: ${surah.ayas}</p>
                    <p>النوع: ${surah.type}</p>
                    <p>الصفحات: ${surah.pages[0]} - ${surah.pages[1]}</p>
                    <p>الترتيب في النزول: ${surah.order || 'غير معروف'}</p>
                </div>
            `;
            
            this.showModal('معلومات السورة', info);
        }
    }
    
    toggleFavorite(surahNumber) {
        const index = this.state.favorites.indexOf(surahNumber);
        
        if (index > -1) {
            // إزالة من المفضلة
            this.state.favorites.splice(index, 1);
            this.showNotification('تمت الإزالة من المفضلة', 'info');
        } else {
            // إضافة إلى المفضلة
            this.state.favorites.push(surahNumber);
            this.showNotification('تمت الإضافة إلى المفضلة', 'success');
        }
        
        this.saveToStorage('favorites', this.state.favorites);
        
        // تحديث واجهة المستخدم
        const surahCard = document.querySelector(`.surah-card[data-surah="${surahNumber}"]`);
        if (surahCard) {
            surahCard.classList.toggle('favorite');
            
            // تحديث أيقونة القلب
            const heartIcon = surahCard.querySelector('.fa-heart');
            if (heartIcon) {
                heartIcon.classList.toggle('active');
            }
        }
    }
    
    // === مشغل الصوت ===
    showPlayer() {
        const player = document.getElementById('audio-player');
        if (player) {
            player.style.display = 'block';
        }
    }
    
    hidePlayer() {
        const player = document.getElementById('audio-player');
        if (player) {
            player.style.display = 'none';
        }
        
        // إيقاف الصوت إذا كان يعمل
        if (this.audioPlayer) {
            this.audioPlayer.pause();
            this.state.isPlaying = false;
            this.updatePlayButton();
        }
    }
    
    updatePlayerInfo(surah, reciter) {
        document.getElementById('player-title').textContent = `سورة ${surah.name}`;
        document.getElementById('player-subtitle').textContent = `القارئ: ${reciter.name}`;
    }
    
    playAudio(url) {
        // إنشاء عنصر الصوت إذا لم يكن موجوداً
        if (!this.audioPlayer) {
            this.audioPlayer = new Audio();
            this.setupAudioEvents();
        }
        
        // تعيين المصدر
        this.audioPlayer.src = url;
        this.audioPlayer.volume = this.state.audioVolume;
        this.audioPlayer.playbackRate = this.state.audioSpeed;
        
        // التشغيل
        this.audioPlayer.play().then(() => {
            this.state.isPlaying = true;
            this.updatePlayButton();
        }).catch(error => {
            console.error('خطأ في تشغيل الصوت:', error);
            this.showNotification('تعذر تشغيل السورة', 'error');
        });
    }
    
    setupAudioEvents() {
        if (!this.audioPlayer) return;
        
        this.audioPlayer.addEventListener('timeupdate', () => {
            this.updateProgressBar();
        });
        
        this.audioPlayer.addEventListener('ended', () => {
            this.state.isPlaying = false;
            this.updatePlayButton();
            this.checkAchievements();
        });
        
        this.audioPlayer.addEventListener('error', (error) => {
            console.error('خطأ في الصوت:', error);
            this.showNotification('حدث خطأ في تشغيل الصوت', 'error');
        });
    }
    
    togglePlayPause() {
        if (!this.audioPlayer) return;
        
        if (this.state.isPlaying) {
            this.audioPlayer.pause();
            this.state.isPlaying = false;
        } else {
            this.audioPlayer.play().then(() => {
                this.state.isPlaying = true;
            }).catch(error => {
                console.error('خطأ في التشغيل:', error);
            });
        }
        
        this.updatePlayButton();
    }
    
    updatePlayButton() {
        const playIcon = document.getElementById('play-icon');
        if (playIcon) {
            playIcon.className = this.state.isPlaying ? 'fas fa-pause' : 'fas fa-play';
        }
    }
    
    updateProgressBar() {
        if (!this.audioPlayer) return;
        
        const progressFill = document.getElementById('progress-fill');
        const currentTimeEl = document.getElementById('current-time');
        const durationEl = document.getElementById('duration');
        
        if (progressFill) {
            const percentage = this.audioPlayer.duration ? 
                (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100 : 0;
            progressFill.style.width = `${percentage}%`;
        }
        
        if (currentTimeEl) {
            currentTimeEl.textContent = this.formatTime(this.audioPlayer.currentTime);
        }
        
        if (durationEl) {
            durationEl.textContent = this.formatTime(this.audioPlayer.duration || 0);
        }
    }
    
    seekAudio(event) {
        if (!this.audioPlayer) return;
        
        const progressBar = event.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const percentage = (event.clientX - rect.left) / rect.width;
        this.audioPlayer.currentTime = percentage * this.audioPlayer.duration;
    }
    
    prevTrack() {
        if (!this.currentTrack) return;
        
        const currentNumber = this.currentTrack.surah.number;
        const prevNumber = currentNumber > 1 ? currentNumber - 1 : 114;
        this.playSurah(prevNumber);
    }
    
    nextTrack() {
        if (!this.currentTrack) return;
        
        const currentNumber = this.currentTrack.surah.number;
        const nextNumber = currentNumber < 114 ? currentNumber + 1 : 1;
        this.playSurah(nextNumber);
    }
    
    toggleRepeat() {
        if (!this.audioPlayer) return;
        
        this.audioPlayer.loop = !this.audioPlayer.loop;
        
        const repeatBtn = document.getElementById('repeat-btn');
        if (repeatBtn) {
            repeatBtn.classList.toggle('active', this.audioPlayer.loop);
        }
        
        this.showNotification(
            this.audioPlayer.loop ? 'تم تفعيل التكرار' : 'تم إيقاف التكرار',
            'info'
        );
    }
    
    toggleMute() {
        if (!this.audioPlayer) return;
        
        this.audioPlayer.muted = !this.audioPlayer.muted;
        
        const volumeBtn = document.getElementById('volume-btn');
        if (volumeBtn) {
            const icon = volumeBtn.querySelector('i');
            if (icon) {
                icon.className = this.audioPlayer.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
            }
        }
    }
    
    // === إدارة التحميلات ===
    selectDownloadOption(optionId) {
        switch (optionId) {
            case 'all':
                this.downloadAllSurahs();
                break;
            case 'favorites':
                this.downloadFavorites();
                break;
            case 'selective':
                this.showSurahSelection();
                break;
            case 'juz':
                this.showJuzSelection();
                break;
        }
    }
    
    downloadAllSurahs() {
        if (!this.state.currentReciter) {
            this.showNotification('الرجاء اختيار قارئ أولاً', 'error');
            return;
        }
        
        this.showConfirmModal(
            'تحميل جميع السور',
            `سيتم تحميل جميع سور القرآن بصوت ${this.state.currentReciter.name}. هذا قد يستغرق وقتاً ويستهلك مساحة تخزين كبيرة.`,
            () => {
                this.showNotification('بدأ تحميل جميع السور', 'info');
                // محاكاة التحميل
                this.simulateDownload();
            }
        );
    }
    
    downloadFavorites() {
        if (this.state.favorites.length === 0) {
            this.showNotification('لا توجد سور مفضلة', 'error');
            return;
        }
        
        if (!this.state.currentReciter) {
            this.showNotification('الرجاء اختيار قارئ أولاً', 'error');
            return;
        }
        
        this.showNotification(`بدأ تحميل ${this.state.favorites.length} سورة مفضلة`, 'info');
        // محاكاة التحميل
        this.simulateDownload();
    }
    
    simulateDownload() {
        // محاكاة عملية التحميل
        setTimeout(() => {
            // إضافة ملف وهمي
            const newDownload = {
                id: this.generateId(),
                surah: { number: 1, name: 'الفاتحة' },
                reciter: this.state.currentReciter || { name: 'مشاري العفاسي' },
                quality: this.state.settings.audioQuality,
                size: 1500000, // 1.5MB
                timestamp: new Date().toISOString()
            };
            
            this.state.downloads.push(newDownload);
            this.saveToStorage('downloaded_files', this.state.downloads);
            
            // تحديث الواجهة
            this.renderDownloadsList();
            this.updateStorageInfo();
            
            this.showNotification('تم تحميل السور بنجاح', 'success');
        }, 2000);
    }
    
    playDownloaded(fileId) {
        const file = this.state.downloads.find(d => d.id === fileId);
        if (file) {
            this.playSurah(file.surah.number);
        }
    }
    
    deleteDownloaded(fileId) {
        const index = this.state.downloads.findIndex(d => d.id === fileId);
        if (index > -1) {
            this.state.downloads.splice(index, 1);
            this.saveToStorage('downloaded_files', this.state.downloads);
            
            // تحديث الواجهة
            this.renderDownloadsList();
            this.updateStorageInfo();
            
            this.showNotification('تم حذف الملف', 'success');
        }
    }
    
    clearDownloads() {
        this.showConfirmModal(
            'تأكيد مسح التحميلات',
            'هل أنت متأكد من مسح جميع الملفات المحملة؟',
            () => {
                this.state.downloads = [];
                this.saveToStorage('downloaded_files', []);
                
                // تحديث الواجهة
                this.renderDownloadsList();
                this.updateStorageInfo();
                
                this.showNotification('تم مسح جميع التحميلات', 'success');
            }
        );
    }
    
    updateStorageInfo() {
        const totalSize = this.state.downloads.reduce((sum, file) => sum + (file.size || 0), 0);
        const maxStorage = 1000 * 1024 * 1024; // 1000MB
        const percentage = Math.min(100, (totalSize / maxStorage) * 100);
        
        const fill = document.getElementById('storage-fill');
        const percentageEl = document.getElementById('storage-percentage');
        const text = document.getElementById('storage-text');
        
        if (fill) {
            fill.style.width = `${percentage}%`;
        }
        
        if (percentageEl) {
            percentageEl.textContent = `${Math.round(percentage)}%`;
        }
        
        if (text) {
            const usedMB = (totalSize / (1024 * 1024)).toFixed(1);
            text.textContent = `${usedMB} MB من 1000 MB`;
        }
    }
    
    // === إدارة الإعدادات ===
    setAudioQuality(quality) {
        this.state.settings.audioQuality = quality;
        this.saveToStorage('settings', this.state.settings);
        this.showNotification(`تم تعيين جودة الصوت إلى: ${quality}`, 'success');
    }
    
    setPlaybackSpeed(speed) {
        this.state.audioSpeed = parseFloat(speed);
        this.state.settings.playbackSpeed = this.state.audioSpeed;
        this.saveToStorage('settings', this.state.settings);
        
        if (this.audioPlayer) {
            this.audioPlayer.playbackRate = this.state.audioSpeed;
        }
        
        this.showNotification(`تم تعيين سرعة التشغيل إلى: ${speed}x`, 'success');
    }
    
    setFontSize(size) {
        this.state.settings.fontSize = size;
        this.saveToStorage('settings', this.state.settings);
        
        // تطبيق حجم الخط
        const sizes = {
            'small': '1.2rem',
            'medium': '1.5rem',
            'large': '1.8rem',
            'xlarge': '2.2rem'
        };
        
        document.documentElement.style.setProperty('--quran-text-md', sizes[size]);
        this.showNotification('تم تغيير حجم الخط', 'success');
    }
    
    toggleNotifications(enabled) {
        this.state.settings.notifications = enabled;
        this.saveToStorage('settings', this.state.settings);
        
        this.showNotification(
            enabled ? 'تم تفعيل الإشعارات' : 'تم إيقاف الإشعارات',
            'info'
        );
    }
    
    toggleDailyReminder(enabled) {
        this.state.settings.dailyReminder = enabled;
        this.saveToStorage('settings', this.state.settings);
        
        this.showNotification(
            enabled ? 'تم تفعيل التذكير اليومي' : 'تم إيقاف التذكير اليومي',
            'info'
        );
    }
    
    exportData() {
        const data = {
            version: '2.0.0',
            exportDate: new Date().toISOString(),
            settings: this.state.settings,
            userData: this.state.userData,
            bookmarks: this.state.bookmarks,
            favorites: this.state.favorites,
            achievements: this.state.achievements,
            listeningStats: this.state.listeningStats,
            downloads: this.state.downloads
        };
        
        // إنشاء ملف JSON
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quran-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('تم تصدير البيانات بنجاح', 'success');
    }
    
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    if (data.version && data.settings) {
                        // استيراد البيانات
                        this.state.settings = data.settings;
                        this.state.userData = data.userData || this.state.userData;
                        this.state.bookmarks = data.bookmarks || [];
                        this.state.favorites = data.favorites || [];
                        this.state.achievements = data.achievements || [];
                        this.state.listeningStats = data.listeningStats || this.state.listeningStats;
                        this.state.downloads = data.downloads || [];
                        
                        // حفظ البيانات
                        this.saveToStorage('settings', this.state.settings);
                        this.saveToStorage('user_data', this.state.userData);
                        this.saveToStorage('bookmarks', this.state.bookmarks);
                        this.saveToStorage('favorites', this.state.favorites);
                        this.saveToStorage('achievements', this.state.achievements);
                        this.saveToStorage('listening_stats', this.state.listeningStats);
                        this.saveToStorage('downloaded_files', this.state.downloads);
                        
                        // تطبيق الإعدادات
                        this.setTheme(this.state.settings.theme);
                        
                        this.showNotification('تم استيراد البيانات بنجاح', 'success');
                        
                        // إعادة تحميل الصفحة
                        setTimeout(() => location.reload(), 1000);
                    } else {
                        this.showNotification('ملف البيانات غير صالح', 'error');
                    }
                } catch (error) {
                    console.error('خطأ في استيراد البيانات:', error);
                    this.showNotification('تعذر استيراد البيانات', 'error');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    resetData() {
        this.showConfirmModal(
            'تأكيد إعادة التعيين',
            'هل أنت متأكد من إعادة تعيين جميع البيانات؟ سيتم حذف جميع الإعدادات والإشارات المرجعية.',
            () => {
                // مسح جميع البيانات
                localStorage.clear();
                
                // إعادة تحميل الصفحة
                location.reload();
            }
        );
    }
    
    // === إدارة النشاط ===
    addActivity(type, title) {
        let activity = this.loadFromStorage('recent_activity') || [];
        
        activity.unshift({
            type,
            title,
            time: this.getTimeAgo(new Date()),
            icon: this.getActivityIcon(type)
        });
        
        // الاحتفاظ بأحدث 10 أنشطة فقط
        activity = activity.slice(0, 10);
        
        this.saveToStorage('recent_activity', activity);
    }
    
    clearRecentActivity() {
        this.saveToStorage('recent_activity', []);
        this.renderRecentActivity();
        this.showNotification('تم مسح النشاط الأخير', 'success');
    }
    
    quickListen() {
        // تشغيل سورة عشوائية
        const surahs = window.SURAH_DATA || this.getSampleSurahs();
        const randomSurah = surahs[Math.floor(Math.random() * surahs.length)];
        this.playSurah(randomSurah.number);
        this.showPage('listen');
    }
    
    openFeature(featureId) {
        switch(featureId) {
            case 1: // الاستماع
                this.showPage('listen');
                break;
            case 2: // القراءة
                this.showPage('read');
                break;
            case 3: // الحفظ
                this.showPage('memorize');
                break;
            case 4: // التحميل
                this.showPage('download');
                break;
            case 5: // الإشارات
                this.showPage('bookmarks');
                break;
            case 6: // الإحصائيات
                this.showPage('statistics');
                break;
        }
    }
    
    // === الإنجازات ===
    checkAchievements() {
        // هذه دالة وهمية للتحقق من الإنجازات
        if (Math.random() > 0.7) { // 30% فرصة
            const newAchievement = {
                id: this.generateId(),
                name: 'المستمع المثابر',
                description: 'استمعت لـ 10 سور مختلفة',
                icon: 'fas fa-headphones',
                date: new Date().toISOString()
            };
            
            this.state.achievements.push(newAchievement);
            this.saveToStorage('achievements', this.state.achievements);
            
            this.showNotification(`🎉 مبروك! لقد حصلت على إنجاز: ${newAchievement.name}`, 'success');
        }
    }
    
    updateListeningStats() {
        const today = new Date().toDateString();
        
        if (this.state.listeningStats.lastUpdated !== today) {
            this.state.listeningStats.todaySeconds = 0;
            this.state.listeningStats.lastUpdated = today;
        }
        
        // زيادة وقت الاستماع
        this.state.listeningStats.todaySeconds += 60; // دقيقة واحدة
        this.state.listeningStats.totalSeconds += 60;
        this.state.listeningStats.weekSeconds = this.state.listeningStats.totalSeconds * 0.1;
        
        this.saveToStorage('listening_stats', this.state.listeningStats);
        
        // تحديث الإحصائيات في الصفحة الرئيسية
        if (this.state.currentPage === 'home') {
            this.renderHomeStats();
        }
    }
    
    // === أدوات مساعدة ===
    generateAudioUrl(reciterId, surahNumber) {
        // إنشاء رابط وهمي للصوت
        return `https://example.com/audio/${reciterId}/${surahNumber.toString().padStart(3, '0')}.mp3`;
    }
    
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' بايت';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' كيلوبايت';
        if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' ميجابايت';
        return (bytes / 1073741824).toFixed(1) + ' جيجابايت';
    }
    
    getTimeAgo(date) {
        const now = new Date();
        const diff = now - new Date(date);
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `قبل ${days} يوم`;
        if (hours > 0) return `قبل ${hours} ساعة`;
        if (minutes > 0) return `قبل ${minutes} دقيقة`;
        return 'الآن';
    }
    
    getActivityIcon(type) {
        const icons = {
            'listen': 'fas fa-headphones',
            'read': 'fas fa-book-open',
            'memorize': 'fas fa-brain',
            'bookmark': 'fas fa-bookmark',
            'download': 'fas fa-download'
        };
        return icons[type] || 'fas fa-star';
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`خطأ في تفعيل الوضع الكامل: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }
    
    showSurahSelection() {
        this.showNotification('قريباً: اختيار السور للتحميل', 'info');
    }
    
    showJuzSelection() {
        this.showNotification('قريباً: اختيار الأجزاء للتحميل', 'info');
    }
    
    // === إدارة التخزين ===
    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(`quran_app_${key}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`خطأ في تحميل البيانات من التخزين: ${error}`);
            return null;
        }
    }
    
    saveToStorage(key, value) {
        try {
            localStorage.setItem(`quran_app_${key}`, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`خطأ في حفظ البيانات للتخزين: ${error}`);
            return false;
        }
    }
    
    // === البيانات الافتراضية ===
    getSampleReciters() {
        return [
            { id: 'afs', name: 'مشاري العفاسي', country: 'الكويت', style: 'مجود', popularity: 95, quality: 'عالية' },
            { id: 'maher', name: 'ماهر المعيقلي', country: 'السعودية', style: 'مرتل', popularity: 90, quality: 'عالية' },
            { id: 'sudais', name: 'عبد الرحمن السديس', country: 'السعودية', style: 'مجود', popularity: 92, quality: 'عالية' },
            { id: 'hudhaify', name: 'علي الحذيفي', country: 'السعودية', style: 'مرتل', popularity: 88, quality: 'عالية' }
        ];
    }
    
    getSampleSurahs() {
        return [
            { number: 1, name: "الفاتحة", ayas: 7, type: "مكية", pages: [1, 1] },
            { number: 2, name: "البقرة", ayas: 286, type: "مدنية", pages: [2, 49] },
            { number: 36, name: "يس", ayas: 83, type: "مكية", pages: [440, 445] },
            { number: 55, name: "الرحمن", ayas: 78, type: "مدنية", pages: [531, 534] },
            { number: 67, name: "الملك", ayas: 30, type: "مكية", pages: [562, 564] },
            { number: 112, name: "الإخلاص", ayas: 4, type: "مكية", pages: [604, 604] }
        ];
    }
    
    getSampleThemes() {
        return [
            { id: 'fateha', name: 'الفاتحة', colors: ['#1a5f23'], icon: 'fas fa-mosque' },
            { id: 'taraweeh', name: 'التراويح', colors: ['#8e44ad'], icon: 'fas fa-moon' },
            { id: 'umrah', name: 'العمرة', colors: ['#2980b9'], icon: 'fas fa-kaaba' },
            { id: 'kaaba', name: 'الكعبة', colors: ['#c0392b'], icon: 'fas fa-hotel' }
        ];
    }
    
    getReciter(id) {
        const reciters = window.RECITERS || this.getSampleReciters();
        return reciters.find(r => r.id === id) || reciters[0];
    }
    
    generateId() {
        return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    
    // === النماذج والإشعارات ===
    showModal(title, content) {
        const modalHTML = `
            <div class="modal active">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">${title}</h2>
                        <button class="modal-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                </div>
            </div>
        `;
        
        const modalContainer = document.createElement('div');
        modalContainer.id = 'temp-modal';
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);
        
        // إضافة حدث الإغلاق
        modalContainer.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modalContainer);
        });
        
        // إغلاق بالنقر خارج المحتوى
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer.querySelector('.modal')) {
                document.body.removeChild(modalContainer);
            }
        });
    }
    
    showConfirmModal(title, message, onConfirm) {
        const modalHTML = `
            <div class="modal active">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">${title}</h2>
                        <button class="modal-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="cancel-btn">إلغاء</button>
                        <button class="btn btn-primary" id="confirm-btn">تأكيد</button>
                    </div>
                </div>
            </div>
        `;
        
        const modalContainer = document.createElement('div');
        modalContainer.id = 'confirm-modal';
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);
        
        // أحداث الأزرار
        modalContainer.querySelector('#cancel-btn').addEventListener('click', () => {
            document.body.removeChild(modalContainer);
        });
        
        modalContainer.querySelector('#confirm-btn').addEventListener('click', () => {
            document.body.removeChild(modalContainer);
            if (onConfirm) onConfirm();
        });
        
        modalContainer.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modalContainer);
        });
        
        // إغلاق بالنقر خارج المحتوى
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer.querySelector('.modal')) {
                document.body.removeChild(modalContainer);
            }
        });
    }
    
    showNotification(message, type = 'info') {
        // استخدام utils إذا كان متاحاً
        if (window.utils && window.utils.notification) {
            window.utils.notification[type](message);
            return;
        }
        
        // بديل بسيط إذا لم يكن utils متاحاً
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">${message}</div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        const container = document.querySelector('.notification-container') || 
                         (() => {
                             const div = document.createElement('div');
                             div.className = 'notification-container';
                             document.body.appendChild(div);
                             return div;
                         })();
        
        container.appendChild(notification);
        
        // إغلاق الإشعار
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
        
        // إغلاق تلقائي بعد 5 ثواني
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
    
    // === أحداث النظام ===
    initEvents() {
        // حدث اتصال/انفصال الشبكة
        window.addEventListener('online', () => {
            this.state.isOnline = true;
            this.showNotification('تم استعادة الاتصال بالإنترنت', 'info');
        });
        
        window.addEventListener('offline', () => {
            this.state.isOnline = false;
            this.showNotification('فقدت الاتصال بالإنترنت', 'warning');
        });
        
        // حدث تغيير حجم النافذة
        window.addEventListener('resize', () => {
            this.emit('resize', { width: window.innerWidth, height: window.innerHeight });
        });
        
        // حدث قبل إغلاق الصفحة
        window.addEventListener('beforeunload', () => {
            this.saveState();
        });
    }
    
    // === حفظ واستعادة الحالة ===
    saveState() {
        const state = {
            currentPage: this.state.currentPage,
            currentSurah: this.state.currentSurah?.number,
            currentReciter: this.state.currentReciter?.id,
            theme: this.state.theme,
            audioVolume: this.state.audioVolume,
            audioSpeed: this.state.audioSpeed
        };
        
        this.saveToStorage('last_state', state);
    }
    
    async restoreState() {
        const state = this.loadFromStorage('last_state');
        
        if (state) {
            if (state.theme && state.theme !== this.state.theme) {
                this.setTheme(state.theme);
            }
            
            if (state.currentReciter) {
                this.selectReciter(state.currentReciter);
            }
            
            if (state.currentPage && state.currentPage !== 'home') {
                setTimeout(() => this.showPage(state.currentPage), 500);
            }
        }
    }
    
    // === إدارة الأحداث المخصصة ===
    on(event, listener) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(listener);
    }
    
    off(event, listener) {
        if (this.listeners[event]) {
            const index = this.listeners[event].indexOf(listener);
            if (index > -1) {
                this.listeners[event].splice(index, 1);
            }
        }
    }
    
    emit(event, data = {}) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(listener => {
                try {
                    listener({ ...data, app: this });
                } catch (error) {
                    console.error(`خطأ في مستمع الحدث ${event}:`, error);
                }
            });
        }
    }
    
    // === عرض الأخطاء ===
    showError(title, message) {
        const appElement = document.getElementById('app');
        if (!appElement) return;
        
        appElement.innerHTML = `
            <div class="error-screen">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h1 class="error-title">${title}</h1>
                <p class="error-message">${message}</p>
                <div class="error-actions">
                    <button class="btn btn-primary" id="reload-btn">
                        <i class="fas fa-redo"></i>
                        إعادة تحميل
                    </button>
                    <button class="btn btn-secondary" id="home-btn">
                        <i class="fas fa-home"></i>
                        الصفحة الرئيسية
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('reload-btn').addEventListener('click', () => {
            location.reload();
        });
        
        document.getElementById('home-btn').addEventListener('click', () => {
            location.reload();
        });
    }
    
    // === التنظيف ===
    destroy() {
        // حفظ الحالة
        this.saveState();
        
        // إيقاف الصوت
        if (this.audioPlayer) {
            this.audioPlayer.pause();
            this.audioPlayer = null;
        }
        
        // إزالة جميع المستمعين
        this.listeners = {};
        
        console.log('🗑️ تم تدمير تطبيق القرآن');
    }
}

// ===== التصدير =====
window.QuranApp = QuranApp;

// ===== رسالة تحميل ناجح =====
console.log('✅ تم تحميل تطبيق القرآن الكريم بنجاح');
console.log('🚀 التطبيق جاهز للتشغيل');

// تصدير الكائنات للاستخدام في الملفات الأخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuranApp;
}