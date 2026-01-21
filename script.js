<meta name='viewport' content='width=device-width, initial-scale=1'/>// بيانات التطبيق
let quranData = [];
let currentSurah = null;
let currentView = 'surahList'; // 'surahList', 'surahView', 'searchResults'
let bookmarks = JSON.parse(localStorage.getItem('quranBookmarks')) || [];
let settings = JSON.parse(localStorage.getItem('quranSettings')) || {
    theme: 'light',
    fontSize: 'medium',
    fontFamily: 'Amiri, serif',
    lineSpacing: '1.6',
    verseDisplay: 'separated',
    showTashkeel: true,
    autoScroll: false
};
let searchResults = [];

// عناصر DOM
const elements = {
    // الأقسام
    surahListSection: document.getElementById('surahListSection'),
    surahViewSection: document.getElementById('surahViewSection'),
    searchResultsSection: document.getElementById('searchResultsSection'),
    
    // قوائم
    surahList: document.getElementById('surahList'),
    versesContainer: document.getElementById('versesContainer'),
    searchResults: document.getElementById('searchResults'),
    
    // عناصر التحكم
    searchBar: document.getElementById('searchBar'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    closeSearch: document.getElementById('closeSearch'),
    surahFilter: document.getElementById('surahFilter'),
    clearSearch: document.getElementById('clearSearch'),
    
    // أزرار التنقل
    backBtn: document.getElementById('backBtn'),
    backFromSearchBtn: document.getElementById('backFromSearchBtn'),
    
    // أزرار التحكم
    themeToggle: document.getElementById('themeToggle'),
    fontSizeToggle: document.getElementById('fontSizeToggle'),
    searchToggle: document.getElementById('searchToggle'),
    
    // أزرار الفوتر
    homeBtn: document.getElementById('homeBtn'),
    bookmarksBtn: document.getElementById('bookmarksBtn'),
    recitationBtn: document.getElementById('recitationBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    
    // النوافذ المنبثقة
    bookmarksModal: document.getElementById('bookmarksModal'),
    recitationModal: document.getElementById('recitationModal'),
    settingsModal: document.getElementById('settingsModal'),
    
    // عناصر المعلومات
    surahCount: document.getElementById('surahCount'),
    currentSurahName: document.getElementById('currentSurahName'),
    currentSurahType: document.getElementById('currentSurahType'),
    currentSurahVerses: document.getElementById('currentSurahVerses'),
    resultsCount: document.getElementById('resultsCount'),
    
    // قوائم النوافذ المنبثقة
    bookmarksList: document.getElementById('bookmarksList'),
    
    // شريط التحميل
    loadingBar: document.getElementById('loadingBar'),
    
    // إعدادات
    fontFamilySelect: document.getElementById('fontFamilySelect'),
    lineSpacingSelect: document.getElementById('lineSpacingSelect'),
    verseDisplaySelect: document.getElementById('verseDisplaySelect'),
    showTashkeel: document.getElementById('showTashkeel'),
    autoScroll: document.getElementById('autoScroll'),
    resetSettings: document.getElementById('resetSettings'),
    saveSettings: document.getElementById('saveSettings')
};

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', function() {
    // تطبيق الإعدادات
    applySettings();
    
    // تحميل بيانات القرآن
    loadQuranData();
    
    // إعداد مستمعي الأحداث
    setupEventListeners();
});

// تحميل بيانات القرآن
async function loadQuranData() {
    try {
        // محاولة جلب البيانات من ملف quran.json
        const response = await fetch('quran.json');
        quranData = await response.json();
        
        // تحديث عدد السور
        elements.surahCount.textContent = quranData.length;
        
        // تعبئة قائمة السور
        populateSurahList();
        
        // تعبئة قائمة التصفية
        populateSurahFilter();
        
        // إخفاء شريط التحميل
        setTimeout(() => {
            elements.loadingBar.style.display = 'none';
        }, 500);
        
    } catch (error) {
        console.error('Error loading Quran data:', error);
        showError('حدث خطأ في تحميل بيانات القرآن. تأكد من وجود ملف quran.json في نفس المجلد.');
        
        // استخدام بيانات افتراضية في حالة الفشل
        loadSampleData();
    }
}

// تحميل بيانات عينة في حالة عدم وجود ملف quran.json
function loadSampleData() {
    quranData = [
        {
            "id": 1,
            "name": "الفاتحة",
            "transliteration": "Al-Fatihah",
            "type": "meccan",
            "total_verses": 7,
            "verses": [
                {"id": 1, "text": "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ"},
                {"id": 2, "text": "ٱلۡحَمۡدُ لِلَّهِ رَبِّ ٱلۡعَٰلَمِينَ"},
                {"id": 3, "text": "ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ"},
                {"id": 4, "text": "مَٰلِكِ يَوۡمِ ٱلدِّينِ"},
                {"id": 5, "text": "إِيَّاكَ نَعۡبُدُ وَإِيَّاكَ نَسۡتَعِينُ"},
                {"id": 6, "text": "ٱهۡدِنَا ٱلصِّرَٰطَ ٱلۡمُسۡتَقِيمَ"},
                {"id": 7, "text": "صِرَٰطَ ٱلَّذِينَ أَنۡعَمۡتَ عَلَيۡهِمۡ غَيۡرِ ٱلۡمَغۡضُوبِ عَلَيۡهِمۡ وَلَا ٱلضَّآلِّينَ"}
            ]
        },
        {
            "id": 2,
            "name": "البقرة",
            "transliteration": "Al-Baqarah",
            "type": "medinan",
            "total_verses": 286,
            "verses": [
                {"id": 1, "text": "الٓمٓ"},
                {"id": 2, "text": "ذَٰلِكَ ٱلۡكِتَٰبُ لَا رَيۡبَۛ فِيهِۛ هُدٗى لِّلۡمُتَّقِينَ"},
                {"id": 3, "text": "ٱلَّذِينَ يُؤۡمِنُونَ بِٱلۡغَيۡبِ وَيُقِيمُونَ ٱلصَّلَوٰةَ وَمِمَّا رَزَقۡنَٰهُمۡ يُنفِقُونَ"}
            ]
        },
        {
            "id": 3,
            "name": "آل عمران",
            "transliteration": "Ali 'Imran",
            "type": "medinan",
            "total_verses": 200,
            "verses": [
                {"id": 1, "text": "الٓمٓ"},
                {"id": 2, "text": "ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلۡحَيُّ ٱلۡقَيُّومُ"},
                {"id": 3, "text": "نَزَّلَ عَلَيۡكَ ٱلۡكِتَٰبَ بِٱلۡحَقِّ مُصَدِّقٗا لِّمَا بَيۡنَ يَدَيۡهِ وَأَنزَلَ ٱلتَّوۡرَىٰةَ وَٱلۡإِنجِيلَ"}
            ]
        }
    ];
    
    // تحديث عدد السور
    elements.surahCount.textContent = quranData.length;
    
    // تعبئة قائمة السور
    populateSurahList();
    
    // تعبئة قائمة التصفية
    populateSurahFilter();
    
    // إخفاء شريط التحميل
    setTimeout(() => {
        elements.loadingBar.style.display = 'none';
    }, 500);
}

// تعبئة قائمة السور
function populateSurahList() {
    elements.surahList.innerHTML = '';
    
    quranData.forEach(surah => {
        const surahCard = document.createElement('div');
        surahCard.className = 'surah-card';
        surahCard.innerHTML = `
            <div class="surah-number">${surah.id}</div>
            <div class="surah-name">${surah.name}</div>
            <div class="surah-name-en">${surah.transliteration}</div>
            <div class="surah-meta">
                <span>${surah.type === 'meccan' ? 'مكية' : 'مدنية'}</span>
                <span>${surah.total_verses} آية</span>
            </div>
        `;
        
        surahCard.addEventListener('click', () => openSurah(surah.id));
        elements.surahList.appendChild(surahCard);
    });
}

// تعبئة قائمة التصفية
function populateSurahFilter() {
    elements.surahFilter.innerHTML = '<option value="all">جميع السور</option>';
    
    quranData.forEach(surah => {
        const option = document.createElement('option');
        option.value = surah.id;
        option.textContent = `${surah.id}. ${surah.name} (${surah.transliteration})`;
        elements.surahFilter.appendChild(option);
    });
}

// فتح سورة
function openSurah(surahId) {
    const surah = quranData.find(s => s.id === surahId);
    if (!surah) return;
    
    currentSurah = surah;
    
    // تحديث معلومات السورة
    elements.currentSurahName.textContent = surah.name;
    elements.currentSurahType.textContent = surah.type === 'meccan' ? 'مكية' : 'مدنية';
    elements.currentSurahVerses.textContent = `${surah.total_verses} آيات`;
    
    // تعبئة الآيات
    elements.versesContainer.innerHTML = '';
    surah.verses.forEach(verse => {
        const verseElement = createVerseElement(surah.id, verse.id, verse.text);
        elements.versesContainer.appendChild(verseElement);
    });
    
    // تغيير العرض
    changeView('surahView');
    
    // التمرير إلى الأعلى
    window.scrollTo(0, 0);
}

// إنشاء عنصر آية
function createVerseElement(surahId, verseId, verseText) {
    const verseElement = document.createElement('div');
    verseElement.className = 'verse-item';
    
    // التحقق مما إذا كانت الآية محفوظة
    const isBookmarked = bookmarks.some(b => b.surahId === surahId && b.verseId === verseId);
    
    verseElement.innerHTML = `
        <div class="verse-number">${verseId}</div>
        <div class="verse-text">${verseText}</div>
        <div class="verse-actions">
            <button class="verse-action-btn bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" 
                    data-surah="${surahId}" data-verse="${verseId}">
                <i class="${isBookmarked ? 'fas' : 'far'} fa-bookmark"></i> 
                ${isBookmarked ? 'محفوظة' : 'حفظ'}
            </button>
            <button class="verse-action-btn share-btn" data-surah="${surahId}" data-verse="${verseId}">
                <i class="fas fa-share-alt"></i> مشاركة
            </button>
            <button class="verse-action-btn play-btn" data-surah="${surahId}" data-verse="${verseId}">
                <i class="fas fa-play"></i> سماع
            </button>
        </div>
    `;
    
    return verseElement;
}

// البحث في الآيات
function searchInQuran(query, surahId = 'all') {
    if (!query.trim()) return;
    
    searchResults = [];
    const lowerQuery = query.trim();
    
    // تحديد السور للبحث فيها
    const surahsToSearch = surahId === 'all' ? 
        quranData : 
        quranData.filter(s => s.id === parseInt(surahId));
    
    // البحث في الآيات
    surahsToSearch.forEach(surah => {
        surah.verses.forEach(verse => {
            // البحث مع التشكيل وبدونه
            const cleanText = verse.text.replace(/[ًٌٍَُِّْٰۖۗۘۙۚۛۜ]/g, '');
            if (verse.text.includes(query) || cleanText.includes(query)) {
                searchResults.push({
                    surahId: surah.id,
                    surahName: surah.name,
                    verseId: verse.id,
                    text: verse.text
                });
            }
        });
    });
    
    // عرض النتائج
    displaySearchResults();
}

// عرض نتائج البحث
function displaySearchResults() {
    elements.searchResults.innerHTML = '';
    elements.resultsCount.textContent = `${searchResults.length} نتيجة`;
    
    if (searchResults.length === 0) {
        elements.searchResults.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>لم يتم العثور على نتائج</p>
                <p class="hint">حاول البحث بكلمات مختلفة</p>
            </div>
        `;
    } else {
        searchResults.forEach(result => {
            const resultElement = document.createElement('div');
            resultElement.className = 'result-item';
            
            // إبراز كلمة البحث في النص
            const highlightedText = highlightText(result.text, elements.searchInput.value.trim());
            
            resultElement.innerHTML = `
                <div class="result-surah">
                    <span>${result.surahName}</span>
                    <span class="badge">الآية ${result.verseId}</span>
                </div>
                <div class="result-text">${highlightedText}</div>
                <div class="verse-actions">
                    <button class="verse-action-btn go-to-verse-btn" 
                            data-surah="${result.surahId}" data-verse="${result.verseId}">
                        <i class="fas fa-external-link-alt"></i> الانتقال إلى الآية
                    </button>
                </div>
            `;
            
            elements.searchResults.appendChild(resultElement);
        });
        
        // إضافة مستمعي الأحداث لأزرار الانتقال
        document.querySelectorAll('.go-to-verse-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const surahId = parseInt(this.getAttribute('data-surah'));
                const verseId = parseInt(this.getAttribute('data-verse'));
                
                // فتح السورة
                openSurah(surahId);
                
                // التمرير إلى الآية المحددة بعد تحميل الآيات
                setTimeout(() => {
                    scrollToVerse(verseId);
                }, 100);
            });
        });
    }
    
    changeView('searchResults');
}

// إبراز النص في نتائج البحث
function highlightText(text, query) {
    if (!query) return text;
    
    // إنشاء تعبير منتظم للبحث
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

// التمرير إلى آية محددة
function scrollToVerse(verseId) {
    const verseElement = document.querySelector(`.verse-item .verse-number`);
    if (verseElement && verseElement.textContent == verseId) {
        verseElement.closest('.verse-item').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
        
        // إضافة تأثير مؤقت
        const verseContainer = verseElement.closest('.verse-item');
        verseContainer.style.boxShadow = '0 0 0 3px var(--secondary-color)';
        setTimeout(() => {
            verseContainer.style.boxShadow = '';
        }, 2000);
    }
}

// تبديل الإشارة المرجعية
function toggleBookmark(surahId, verseId) {
    const surah = quranData.find(s => s.id === surahId);
    const verse = surah?.verses.find(v => v.id === verseId);
    
    if (!surah || !verse) return;
    
    const existingIndex = bookmarks.findIndex(b => b.surahId === surahId && b.verseId === verseId);
    
    if (existingIndex !== -1) {
        // إزالة الإشارة المرجعية
        bookmarks.splice(existingIndex, 1);
        showNotification('تمت إزالة الآية من المحفوظات');
    } else {
        // إضافة إشارة مرجعية جديدة
        bookmarks.push({
            surahId,
            surahName: surah.name,
            verseId,
            verseText: verse.text,
            timestamp: new Date().toISOString()
        });
        showNotification('تمت إضافة الآية إلى المحفوظات');
    }
    
    // حفظ في التخزين المحلي
    localStorage.setItem('quranBookmarks', JSON.stringify(bookmarks));
    
    // تحديث العرض
    updateBookmarksDisplay();
    
    // تحديث زر الإشارة المرجعية في الآية الحالية
    updateBookmarkButton(surahId, verseId);
}

// تحديث زر الإشارة المرجعية
function updateBookmarkButton(surahId, verseId) {
    const isBookmarked = bookmarks.some(b => b.surahId === surahId && b.verseId === verseId);
    const bookmarkBtn = document.querySelector(`.bookmark-btn[data-surah="${surahId}"][data-verse="${verseId}"]`);
    
    if (bookmarkBtn) {
        bookmarkBtn.classList.toggle('bookmarked', isBookmarked);
        bookmarkBtn.innerHTML = `
            <i class="${isBookmarked ? 'fas' : 'far'} fa-bookmark"></i> 
            ${isBookmarked ? 'محفوظة' : 'حفظ'}
        `;
    }
}

// تحديث عرض المحفوظات
function updateBookmarksDisplay() {
    elements.bookmarksList.innerHTML = '';
    
    if (bookmarks.length === 0) {
        document.getElementById('noBookmarks').style.display = 'block';
        return;
    }
    
    document.getElementById('noBookmarks').style.display = 'none';
    
    // ترتيب المحفوظات حسب الوقت
    bookmarks.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    bookmarks.forEach(bookmark => {
        const bookmarkElement = document.createElement('div');
        bookmarkElement.className = 'bookmark-item';
        bookmarkElement.innerHTML = `
            <div class="result-surah">
                <span>${bookmark.surahName}</span>
                <span class="badge">الآية ${bookmark.verseId}</span>
            </div>
            <div class="result-text">${bookmark.verseText}</div>
            <div class="verse-actions">
                <button class="verse-action-btn go-to-bookmark-btn" 
                        data-surah="${bookmark.surahId}" data-verse="${bookmark.verseId}">
                    <i class="fas fa-external-link-alt"></i> الانتقال
                </button>
                <button class="verse-action-btn remove-bookmark-btn" 
                        data-surah="${bookmark.surahId}" data-verse="${bookmark.verseId}">
                    <i class="fas fa-trash"></i> إزالة
                </button>
            </div>
        `;
        
        elements.bookmarksList.appendChild(bookmarkElement);
    });
    
    // إضافة مستمعي الأحداث
    document.querySelectorAll('.go-to-bookmark-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const surahId = parseInt(this.getAttribute('data-surah'));
            const verseId = parseInt(this.getAttribute('data-verse'));
            
            // إغلاق النافذة المنبثقة
            elements.bookmarksModal.classList.remove('active');
            
            // فتح السورة
            openSurah(surahId);
            
            // التمرير إلى الآية المحددة بعد تحميل الآيات
            setTimeout(() => {
                scrollToVerse(verseId);
            }, 100);
        });
    });
    
    document.querySelectorAll('.remove-bookmark-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const surahId = parseInt(this.getAttribute('data-surah'));
            const verseId = parseInt(this.getAttribute('data-verse'));
            toggleBookmark(surahId, verseId);
        });
    });
}

// مشاركة آية
function shareVerse(surahId, verseId) {
    const surah = quranData.find(s => s.id === surahId);
    const verse = surah?.verses.find(v => v.id === verseId);
    
    if (!surah || !verse) return;
    
    const textToShare = `سورة ${surah.name} - الآية ${verseId}\n${verse.text}\n\nمن تطبيق القرآن الكريم`;
    
    if (navigator.share) {
        navigator.share({
            title: `آية من القرآن الكريم`,
            text: textToShare,
            url: window.location.href
        });
    } else {
        // نسخ إلى الحافظة
        navigator.clipboard.writeText(textToShare).then(() => {
            showNotification('تم نسخ الآية إلى الحافظة');
        });
    }
}

// تشغيل تلاوة الآية
function playRecitation(surahId, verseId) {
    showNotification('سيتم إضافة ميزة التلاوة في تحديث قادم');
    // يمكن إضافة تكامل مع خدمة مثل Quran.com API
}

// تطبيق الإعدادات
function applySettings() {
    // تطبيق السمة
    document.documentElement.setAttribute('data-theme', settings.theme);
    updateThemeIcon();
    
    // تطبيق حجم الخط
    document.body.classList.remove('font-small', 'font-medium', 'font-large');
    document.body.classList.add(`font-${settings.fontSize}`);
    updateFontSizeIcon();
    
    // تطبيق خط النص العربي
    document.querySelectorAll('.verse-text, .result-text, .bismillah p').forEach(el => {
        el.style.fontFamily = settings.fontFamily;
    });
    
    // تطبيق تباعد الأسطر
    document.querySelectorAll('.verse-text, .result-text').forEach(el => {
        el.style.lineHeight = settings.lineSpacing;
    });
    
    // تطبيق خيارات أخرى
    if (elements.fontFamilySelect) elements.fontFamilySelect.value = settings.fontFamily;
    if (elements.lineSpacingSelect) elements.lineSpacingSelect.value = settings.lineSpacing;
    if (elements.verseDisplaySelect) elements.verseDisplaySelect.value = settings.verseDisplay;
    if (elements.showTashkeel) elements.showTashkeel.checked = settings.showTashkeel;
    if (elements.autoScroll) elements.autoScroll.checked = settings.autoScroll;
}

// حفظ الإعدادات
function saveSettings() {
    settings.theme = document.documentElement.getAttribute('data-theme') || 'light';
    settings.fontSize = document.body.classList.contains('font-small') ? 'small' : 
                        document.body.classList.contains('font-large') ? 'large' : 'medium';
    settings.fontFamily = elements.fontFamilySelect.value;
    settings.lineSpacing = elements.lineSpacingSelect.value;
    settings.verseDisplay = elements.verseDisplaySelect.value;
    settings.showTashkeel = elements.showTashkeel.checked;
    settings.autoScroll = elements.autoScroll.checked;
    
    localStorage.setItem('quranSettings', JSON.stringify(settings));
    showNotification('تم حفظ الإعدادات');
    elements.settingsModal.classList.remove('active');
    
    // تطبيق الإعدادات المحدثة
    applySettings();
}

// استعادة الإعدادات الافتراضية
function resetSettings() {
    settings = {
        theme: 'light',
        fontSize: 'medium',
        fontFamily: 'Amiri, serif',
        lineSpacing: '1.6',
        verseDisplay: 'separated',
        showTashkeel: true,
        autoScroll: false
    };
    
    applySettings();
    showNotification('تم استعادة الإعدادات الافتراضية');
}

// تبديل الوضع الليلي
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    updateThemeIcon();
}

// تحديث أيقونة الوضع الليلي
function updateThemeIcon() {
    const icon = elements.themeToggle.querySelector('i');
    if (document.documentElement.getAttribute('data-theme') === 'dark') {
        icon.className = 'fas fa-sun';
        elements.themeToggle.title = 'الوضع النهاري';
    } else {
        icon.className = 'fas fa-moon';
        elements.themeToggle.title = 'الوضع الليلي';
    }
}

// تبديل حجم الخط
function toggleFontSize() {
    const sizes = ['small', 'medium', 'large'];
    const currentSize = document.body.classList.contains('font-small') ? 'small' :
                        document.body.classList.contains('font-large') ? 'large' : 'medium';
    const currentIndex = sizes.indexOf(currentSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    
    document.body.classList.remove('font-small', 'font-medium', 'font-large');
    document.body.classList.add(`font-${sizes[nextIndex]}`);
    
    updateFontSizeIcon();
}

// تحديث أيقونة حجم الخط
function updateFontSizeIcon() {
    const icon = elements.fontSizeToggle.querySelector('i');
    const titles = ['حجم الخط: صغير', 'حجم الخط: متوسط', 'حجم الخط: كبير'];
    const currentSize = document.body.classList.contains('font-small') ? 'small' :
                        document.body.classList.contains('font-large') ? 'large' : 'medium';
    const sizes = ['small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(currentSize);
    
    elements.fontSizeToggle.title = titles[currentIndex];
}

// تبديل شريط البحث
function toggleSearchBar() {
    elements.searchBar.classList.toggle('active');
    if (elements.searchBar.classList.contains('active')) {
        elements.searchInput.focus();
    }
}

// تغيير طريقة العرض
function changeView(view) {
    currentView = view;
    
    // إخفاء جميع الأقسام
    elements.surahListSection.classList.remove('active');
    elements.surahViewSection.classList.remove('active');
    elements.searchResultsSection.classList.remove('active');
    
    // تحديث أزرار التنقل
    elements.homeBtn.classList.remove('active');
    
    // إظهار القسم المطلوب
    if (view === 'surahList') {
        elements.surahListSection.classList.add('active');
        elements.homeBtn.classList.add('active');
    } else if (view === 'surahView') {
        elements.surahViewSection.classList.add('active');
    } else if (view === 'searchResults') {
        elements.searchResultsSection.classList.add('active');
    }
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // البحث
    elements.searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const surahId = elements.surahFilter.value;
            searchInQuran(this.value, surahId);
        }
    });
    
    elements.searchBtn.addEventListener('click', () => {
        const surahId = elements.surahFilter.value;
        searchInQuran(elements.searchInput.value, surahId);
    });
    
    elements.clearSearch.addEventListener('click', () => {
        elements.searchInput.value = '';
        elements.searchInput.focus();
    });
    
    elements.closeSearch.addEventListener('click', () => {
        elements.searchBar.classList.remove('active');
    });
    
    // التحكم في المظهر
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.fontSizeToggle.addEventListener('click', toggleFontSize);
    elements.searchToggle.addEventListener('click', toggleSearchBar);
    
    // التنقل
    elements.backBtn.addEventListener('click', () => changeView('surahList'));
    elements.backFromSearchBtn.addEventListener('click', () => changeView('surahList'));
    
    // أزرار الفوتر
    elements.homeBtn.addEventListener('click', () => changeView('surahList'));
    elements.bookmarksBtn.addEventListener('click', () => {
        updateBookmarksDisplay();
        elements.bookmarksModal.classList.add('active');
    });
    elements.recitationBtn.addEventListener('click', () => {
        elements.recitationModal.classList.add('active');
    });
    elements.settingsBtn.addEventListener('click', () => {
        elements.settingsModal.classList.add('active');
    });
    
    // إغلاق النوافذ المنبثقة
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('active');
        });
    });
    
    // إغلاق النوافذ المنبثقة بالنقر خارجها
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
    
    // الإعدادات
    elements.saveSettings.addEventListener('click', saveSettings);
    elements.resetSettings.addEventListener('click', resetSettings);
    
    // مستمع الأحداث للنقر على الآيات (يتم إضافته بعد إنشاء الآيات)
    document.addEventListener('click', function(e) {
        // معالجة النقر على أزرار الإشارات المرجعية
        if (e.target.closest('.bookmark-btn')) {
            const btn = e.target.closest('.bookmark-btn');
            const surahId = parseInt(btn.getAttribute('data-surah'));
            const verseId = parseInt(btn.getAttribute('data-verse'));
            toggleBookmark(surahId, verseId);
        }
        
        // معالجة النقر على أزرار المشاركة
        if (e.target.closest('.share-btn')) {
            const btn = e.target.closest('.share-btn');
            const surahId = parseInt(btn.getAttribute('data-surah'));
            const verseId = parseInt(btn.getAttribute('data-verse'));
            shareVerse(surahId, verseId);
        }
        
        // معالجة النقر على أزرار التشغيل
        if (e.target.closest('.play-btn')) {
            const btn = e.target.closest('.play-btn');
            const surahId = parseInt(btn.getAttribute('data-surah'));
            const verseId = parseInt(btn.getAttribute('data-verse'));
            playRecitation(surahId, verseId);
        }
    });
}

// عرض الإشعارات
function showNotification(message) {
    // إنشاء عنصر الإشعار
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        left: 20px;
        background-color: var(--secondary-color);
        color: white;
        padding: 12px 16px;
        border-radius: var(--border-radius);
        text-align: center;
        z-index: 1000;
        box-shadow: var(--shadow);
        animation: slideIn 0.3s ease;
    `;
    
    // إضافة أنماط CSS للحركة
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateY(100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateY(0); opacity: 1; }
            to { transform: translateY(100px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // إزالة الإشعار بعد 3 ثوان
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// عرض رسالة خطأ
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        background-color: #e74c3c;
        color: white;
        padding: 1rem;
        border-radius: var(--border-radius);
        text-align: center;
        margin: 1rem;
        font-weight: bold;
        position: fixed;
        top: 100px;
        left: 20px;
        right: 20px;
        z-index: 1001;
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.style.opacity = '0';
        errorDiv.style.transition = 'opacity 0.5s';
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 500);
    }, 5000);
}

// نسخة مبسطة من Service Worker لـ PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // محاولة تسجيل Service Worker
        try {
            navigator.serviceWorker.register('sw.js');
        } catch (e) {
            console.log('Service Worker registration failed:', e);
        }
    });
}