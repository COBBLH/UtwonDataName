// =============================================
// SCHOOL DASHBOARD - school.js
// Scoped to the logged-in school via schoolLoginData
// =============================================

// ── Firebase Init ──────────────────────────────────────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyAburxavDgOMyvljxW_I40EPiRva3tj4ag",
    authDomain: "utowndataname.firebaseapp.com",
    projectId: "utowndataname",
    storageBucket: "utowndataname.firebasestorage.app",
    messagingSenderId: "271049356376",
    appId: "1:271049356376:web:98a77535112d21e6c6862d"
};
if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const db = firebase.firestore();

// ── Session / Auth ────────────────────────────────────────────────────────
let schoolSession = null;
let currentSchoolDoc = null;

function checkSchoolSession() {
    const raw = localStorage.getItem('schoolLoginData');
    if (!raw) { window.location.href = 'index.html'; return; }
    try {
        schoolSession = JSON.parse(raw);
        currentSchoolDoc = schoolSession.schoolData || null;
        if (!currentSchoolDoc) { window.location.href = 'index.html'; return; }
    } catch (e) {
        localStorage.removeItem('schoolLoginData');
        window.location.href = 'index.html';
        return;
    }
    const name = currentSchoolDoc.schoolname || 'School';
    document.querySelectorAll('#userDropdownText, #mobileUserDropdownText').forEach(function(el) {
        el.textContent = 'Hello, ' + (currentSchoolDoc.username || name);
    });
    const sidebarLabel = document.getElementById('sidebarSchoolName');
    if (sidebarLabel) sidebarLabel.textContent = name;
    document.title = name + ' Dashboard - UTOWN DATA NAME';

    const schoolDocId = getSchoolDocId();
    const schoolFilter = document.getElementById('schoolFilter');
    if (schoolFilter) {
        schoolFilter.innerHTML = '';
        const opt = document.createElement('option');
        opt.value = schoolDocId;
        opt.textContent = name;
        schoolFilter.appendChild(opt);
        schoolFilter.value = schoolDocId;
        schoolFilter.disabled = true;
    }
    currentSchool = schoolDocId;
}

function getSchoolDocId() {
    return currentSchoolDoc ? (currentSchoolDoc.id || currentSchoolDoc.docId || currentSchoolDoc.schoolabbrev || '') : '';
}

// ── IP / PC helpers ────────────────────────────────────────────────────────
let cachedIP = '';
async function fetchClientIP() {
    if (cachedIP) return cachedIP;
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const json = await res.json();
        cachedIP = json.ip || 'unknown';
    } catch (e) { cachedIP = 'unknown'; }
    return cachedIP;
}

function getPCIdentifier() {
    const ua = navigator.userAgent;
    let osInfo = navigator.platform || 'unknown';
    if (ua.indexOf('Windows NT 10.0') !== -1) osInfo = 'Windows 10/11';
    else if (ua.indexOf('Windows NT 6.3') !== -1) osInfo = 'Windows 8.1';
    else if (ua.indexOf('Windows NT 6.1') !== -1) osInfo = 'Windows 7';
    else if (ua.indexOf('Windows') !== -1) osInfo = 'Windows';
    else if (ua.indexOf('Mac') !== -1) osInfo = 'MacOS';
    else if (ua.indexOf('Linux') !== -1) osInfo = 'Linux';
    else if (ua.indexOf('Android') !== -1) osInfo = 'Android';
    else if (ua.indexOf('iPhone') !== -1 || ua.indexOf('iPad') !== -1) osInfo = 'iOS';
    return osInfo;
}

// ── Firestore ActivityLog writer ──────────────────────────────────────────
// Uses timestamp-based ID instead of collection-scanning for the counter
function generateActivityLogId() {
    return 'ActivityID_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
}

async function saveActivityLog(description, location) {
    try {
        const actId = generateActivityLogId();
        const ip = await fetchClientIP();
        const pc = getPCIdentifier();
        const schoolDoc = currentSchoolDoc || {};
        await db.collection('ActivityLog').doc(actId).set({
            ActivityID: actId,
            AccountRole: 'school',
            Username: schoolDoc.username || 'school',
            UserID: getSchoolDocId(),
            Description: description,
            Location: location || 'school.html',
            IP_ADDRESS: ip,
            PC: pc,
            TimeStamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) { console.error('saveActivityLog error:', e); }
}

async function logSchoolLogin() {
    const ip = await fetchClientIP();
    const pc = getPCIdentifier();
    const schoolDoc = currentSchoolDoc || {};
    try {
        const actId = generateActivityLogId();
        const description = (schoolDoc.username || 'school') + ' has logged in to school portal | IP: ' + ip + ' | Device: ' + pc;
        await db.collection('ActivityLog').doc(actId).set({
            ActivityID: actId,
            AccountRole: 'school',
            Username: schoolDoc.username || 'school',
            UserID: getSchoolDocId(),
            Description: description,
            Location: 'school.html',
            IP_ADDRESS: ip,
            PC: pc,
            TimeStamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) { console.error('logSchoolLogin error:', e); }
}

// ── Navigation ────────────────────────────────────────────────────────────
function toggleMobileMenu() {
    document.getElementById('mobileMenu').classList.toggle('active');
    document.querySelector('.mobile-menu-btn').classList.toggle('active');
}
function closeMobileMenu() {
    document.getElementById('mobileMenu').classList.remove('active');
    document.querySelector('.mobile-menu-btn').classList.remove('active');
}
function toggleUserDropdown() { document.getElementById('userDropdownContent').classList.toggle('show'); }
function toggleMobileUserDropdown() { document.getElementById('mobileUserDropdownContent').classList.toggle('show'); }
function handleSignIn() {}

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(function(s) { s.classList.remove('active'); });
    const target = document.getElementById(sectionId);
    if (target) target.classList.add('active');
    document.querySelectorAll('.sidebar-menu a').forEach(function(a) { a.classList.remove('active'); });
    const clicked = event && event.target ? event.target.closest('a') : null;
    if (clicked) clicked.classList.add('active');

    if (sectionId === 'activity-log') {
        if (!activityLogState.initialized && !activityLogState.isLoading) initActivityLog();
    }
    if (sectionId === 'add-course') { clLoadCoursesFromFirestore(); }
    if (sectionId === 'school-profile') { loadSchoolProfile(); }
    if (sectionId === 'settings') { loadSchoolSettingsForm(); }
}

// ── Logout Modal ──────────────────────────────────────────────────────────
function handleLogout() { openLogoutModal(); }
function openLogoutModal() {
    document.getElementById('logoutConfirmModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}
function closeLogoutModal() {
    document.getElementById('logoutConfirmModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}
async function confirmLogout() {
    closeLogoutModal();
    const schoolDoc = currentSchoolDoc || {};
    await saveActivityLog(schoolDoc.username + ' has logged out of school portal', 'school.html');
    localStorage.removeItem('schoolLoginData');
    window.location.href = 'index.html';
}

function openAboutModal() { document.getElementById('aboutModal').style.display = 'block'; document.body.style.overflow = 'hidden'; }
function openContactModal() { document.getElementById('contactModal').style.display = 'block'; document.body.style.overflow = 'hidden'; }
function closeModal(modalId) { document.getElementById(modalId).style.display = 'none'; document.body.style.overflow = 'auto'; }

// ── Toast ─────────────────────────────────────────────────────────────────
function showToast(message, type) {
    type = type || 'success';
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-exclamation-circle';
    toast.className = 'toast toast-' + type;
    toast.innerHTML = '<i class="fas ' + icon + '"></i> ' + message;
    container.appendChild(toast);
    setTimeout(function() { toast.classList.add('show'); }, 10);
    setTimeout(function() { toast.classList.remove('show'); setTimeout(function() { toast.remove(); }, 300); }, 3500);
}

// ── State Variables ───────────────────────────────────────────────────────
let schoolsData = {
    all: { enrollees:{}, outside:{}, inside:{}, graduates:{}, passers:{} }
};
let academicYears = ['2020-2021','2021-2022','2022-2023','2023-2024','2024-2025'];
const YEAR_WINDOW_SIZE = 10;
let yearWindowStart = 2020;
let currentFilter = 'enrollees';
let currentSchool = 'all';
let currentEducationalLevel = 'all';
let courseList = [];
let allSchoolDocs = [];
let friendlyIdCounter = 0;

// Real-time listener for Data_Analytics (replaces _dataLoadCache)
let dataAnalyticsListener = null;

// Caches to reduce Firestore reads (courses and summary stats still cached)
let _courseLoadCache = {};
let _summaryLoadCache = {};

function getCurrentAcademicYear() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return m >= 7 ? (y + '-' + (y + 1)) : ((y - 1) + '-' + y);
}
function getVisibleYears() {
    const years = [];
    for (let i = 0; i < YEAR_WINDOW_SIZE; i++) {
        years.push((yearWindowStart + i) + '-' + (yearWindowStart + i + 1));
    }
    return years;
}
function initYearWindowStart() {
    const realYear = new Date().getFullYear();
    yearWindowStart = Math.floor(realYear / 10) * 10;
}
function yearNavPrev() { yearWindowStart -= YEAR_WINDOW_SIZE; renderYearNavigator(); updateUnifiedTableHeaders(); updateUnifiedTable(); }
function yearNavNext() { yearWindowStart += YEAR_WINDOW_SIZE; renderYearNavigator(); updateUnifiedTableHeaders(); updateUnifiedTable(); }
function renderYearNavigator() {}

function filterBySchool() {}

// ── Loading Animation Helpers ─────────────────────────────────────────────
function showDashboardLoading() {
    var overlay = document.getElementById('dashboardLoadingOverlay');
    if (overlay) overlay.style.display = 'flex';
}
function hideDashboardLoading() {
    var overlay = document.getElementById('dashboardLoadingOverlay');
    if (overlay) overlay.style.display = 'none';
}

var _statIds = ['totalEnrollees', 'totalOutside', 'totalInside', 'totalGraduates', 'totalPassers'];

function showStatLoading() {
    var spinner = '<span class="summary-stat-spinner"></span>';
    _statIds.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.innerHTML = spinner;
    });
    document.querySelectorAll('.summary-card').forEach(function(card) { card.classList.add('stat-loading'); });
}

function clearStatLoading() {
    document.querySelectorAll('.summary-card').forEach(function(card) { card.classList.remove('stat-loading'); });
}

function zeroOutSummaryStats() {
    _statIds.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.textContent = '0';
    });
    clearStatLoading();
}

// ── Summary Stats ─────────────────────────────────────────────────────────
// Reads summary data from already-loaded schoolsData in memory.
// Only hits Firestore if data hasn't been fetched for this school+edu combo.
async function loadSummaryStatsFromFirestore() {
    if (currentEducationalLevel === 'all') {
        zeroOutSummaryStats();
        return;
    }

    var eduMap = {
        'bachelor': 'BACHELOR DEGREE',
        'twoyear': '2-YEAR COURSE',
        'tesda': 'TESDA',
        'graduate': 'GRADUATE COURSE'
    };
    var targetEdu = eduMap[currentEducationalLevel];
    if (!targetEdu) { zeroOutSummaryStats(); return; }

    var summaryCacheKey = currentSchool + '_' + currentEducationalLevel;
    if (_summaryLoadCache[summaryCacheKey]) {
        updateSummary();
        return;
    }

    var categoryFirebaseMap = {
        'outside':   'OutsideBataan',
        'inside':    'InsideBataan',
        'graduates': 'Graduates',
        'passers':   'NumberofBoardPasser'
    };

    showStatLoading();

    try {
        var baseQuery = db.collection('Data_Analytics')
            .where('EDUCATIONAL_ATTAINMENT', '==', targetEdu)
            .where('SchoolID', '==', currentSchool);

        var queries = Object.keys(categoryFirebaseMap).map(function(catKey) {
            return baseQuery.where('CATEGORY', '==', categoryFirebaseMap[catKey]).get().then(function(snap) {
                var total = 0;
                snap.forEach(function(doc) {
                    var d = doc.data();
                    total += (d.MALE || 0) + (d.FEMALE || 0);
                });
                return { catKey: catKey, total: total };
            });
        });

        var results = await Promise.all(queries);

        var totals = { outside: 0, inside: 0, graduates: 0, passers: 0 };
        results.forEach(function(r) { totals[r.catKey] = r.total; });

        var enrolleesTotal = totals.outside + totals.inside + totals.graduates + totals.passers;

        document.getElementById('totalEnrollees').textContent = enrolleesTotal.toLocaleString();
        document.getElementById('totalOutside').textContent   = totals.outside.toLocaleString();
        document.getElementById('totalInside').textContent    = totals.inside.toLocaleString();
        document.getElementById('totalGraduates').textContent = totals.graduates.toLocaleString();
        document.getElementById('totalPassers').textContent   = totals.passers.toLocaleString();

        _summaryLoadCache[summaryCacheKey] = true;
    } catch (err) {
        console.error('loadSummaryStatsFromFirestore error:', err);
        _statIds.forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.textContent = 'Error';
        });
    } finally {
        clearStatLoading();
    }
}

// ── updateSummary (sums all categories from in-memory data) ──────────────
function updateSummary() {
    if (currentEducationalLevel === 'all') {
        zeroOutSummaryStats();
        return;
    }

    function sumCategory(catKey) {
        var schoolKey = currentSchool || 'all';
        if (!schoolsData[schoolKey] || !schoolsData[schoolKey][catKey]) return 0;
        var catData = schoolsData[schoolKey][catKey];
        var total = 0;
        Object.keys(catData).forEach(function(course) {
            if (catData[course]) {
                catData[course].forEach(function(genderData) {
                    if (genderData && typeof genderData === 'object') {
                        total += (genderData.male || 0) + (genderData.female || 0);
                    } else {
                        total += (genderData || 0);
                    }
                });
            }
        });
        return total;
    }

    var outsideTotal   = sumCategory('outside');
    var insideTotal    = sumCategory('inside');
    var graduatesTotal = sumCategory('graduates');
    var passersTotal   = sumCategory('passers');
    var enrolleesTotal = outsideTotal + insideTotal + graduatesTotal + passersTotal;

    document.getElementById('totalEnrollees').textContent = enrolleesTotal.toLocaleString();
    document.getElementById('totalOutside').textContent   = outsideTotal.toLocaleString();
    document.getElementById('totalInside').textContent    = insideTotal.toLocaleString();
    document.getElementById('totalGraduates').textContent = graduatesTotal.toLocaleString();
    document.getElementById('totalPassers').textContent   = passersTotal.toLocaleString();
}

// ── filterByEducationalAttainment ─────────────────────────────────────────
async function filterByEducationalAttainment() {
    const educationalFilter = document.getElementById('educationalFilter');
    currentEducationalLevel = educationalFilter.value;

    const sectionTitle = document.querySelector('#school-data .section-title');
    const schoolName = currentSchoolDoc ? (currentSchoolDoc.schoolname || 'School') : 'School';
    const eduName = educationalFilter.options[educationalFilter.selectedIndex].text;
    if (sectionTitle) sectionTitle.innerHTML = '<i class="fas fa-chart-bar"></i> School Data Analytics - ' + schoolName + ' | ' + eduName;

    // Reset both summary and course caches for new edu level combination
    const cacheKey = currentSchool + '_' + currentEducationalLevel;
    _summaryLoadCache[cacheKey] = false;
    _courseLoadCache[cacheKey] = false;

    await loadCoursesFromFirestore();

    // Setup real-time listener with new filters (mirrors superadmin pattern)
    setupDataAnalyticsListener();

    // Immediately retrieve and display all summary statistics
    loadSummaryStatsFromFirestore();

    saveActivityLog((currentSchoolDoc ? currentSchoolDoc.username : 'school') + ' filtered data by educational attainment: ' + eduName, 'school.html');
}

// ── filterByCategory ──────────────────────────────────────────────────────
function filterByCategory() {
    const categoryFilter = document.getElementById('categoryFilter');
    currentFilter = categoryFilter.value;

    // Setup real-time listener with new filters (mirrors superadmin pattern)
    setupDataAnalyticsListener();

    updateUnifiedTable();
    updateSummary();
}

// ── setupDataAnalyticsListener (real-time, mirrors superadmin) ─────────────
function setupDataAnalyticsListener() {
    // Tear down existing listener before creating a new one
    if (dataAnalyticsListener) {
        dataAnalyticsListener();
        dataAnalyticsListener = null;
    }

    // Always scope to this school only (school-level optimization)
    if (!currentSchool || currentSchool === 'all') return;

    let query = db.collection('Data_Analytics').where('SchoolID', '==', currentSchool);

    if (currentEducationalLevel && currentEducationalLevel !== 'all') {
        var eduMap = {
            'bachelor': 'BACHELOR DEGREE',
            'twoyear': '2-YEAR COURSE',
            'tesda': 'TESDA',
            'graduate': 'GRADUATE COURSE'
        };
        var targetEdu = eduMap[currentEducationalLevel];
        if (targetEdu) {
            query = query.where('EDUCATIONAL_ATTAINMENT', '==', targetEdu);
        }
    }

    if (currentFilter && currentFilter !== 'all' && currentFilter !== 'enrollees') {
        var categoryMap = {
            'outside':   'OutsideBataan',
            'inside':    'InsideBataan',
            'graduates': 'Graduates',
            'passers':   'NumberofBoardPasser'
        };
        var targetCategory = categoryMap[currentFilter];
        if (targetCategory) {
            query = query.where('CATEGORY', '==', targetCategory);
        }
    }

    showStatLoading();

    dataAnalyticsListener = query.onSnapshot(function(snapshot) {
        updateTableFromFirestoreSnapshot(snapshot);
        clearStatLoading();
    }, function(error) {
        console.error('setupDataAnalyticsListener error:', error);
        clearStatLoading();
    });
}

// ── updateTableFromFirestoreSnapshot (mirrors superadmin) ─────────────────
function updateTableFromFirestoreSnapshot(snapshot) {
    var targetKey = currentSchool || 'all';
    var targetCategory = currentFilter || 'enrollees';

    if (!schoolsData[targetKey]) {
        schoolsData[targetKey] = { enrollees:{}, outside:{}, inside:{}, graduates:{}, passers:{} };
    }
    if (!schoolsData[targetKey][targetCategory]) {
        schoolsData[targetKey][targetCategory] = {};
    }

    // Clear existing data values (but keep keys for courses already loaded)
    var existingCourses = Object.keys(schoolsData[targetKey][targetCategory]);
    existingCourses.forEach(function(course) {
        schoolsData[targetKey][targetCategory][course] = new Array(academicYears.length).fill(0).map(function() { return { male: 0, female: 0 }; });
    });

    // Process snapshot analytics data
    snapshot.forEach(function(doc) {
        var data = doc.data();
        var courseName = data.COURSE;
        var year = data.YEAR;
        var male = data.MALE || 0;
        var female = data.FEMALE || 0;

        var yearIndex = academicYears.indexOf(year);
        if (yearIndex === -1) return;

        if (!schoolsData[targetKey][targetCategory][courseName]) {
            schoolsData[targetKey][targetCategory][courseName] = new Array(academicYears.length).fill(0).map(function() { return { male: 0, female: 0 }; });
        }
        schoolsData[targetKey][targetCategory][courseName][yearIndex] = { male: male, female: female };
    });

    // Ensure ALL courses from courseList are represented (even with zero data)
    var _eduMap = { 'bachelor': 'BACHELOR DEGREE', 'twoyear': '2-YEAR COURSE', 'tesda': 'TESDA', 'graduate': 'GRADUATE COURSE' };
    var _targetEduLabel = _eduMap[currentEducationalLevel];

    courseList.forEach(function(c) {
        var matchSchool = c.school === targetKey;
        var matchEdu = !_targetEduLabel || c.eduLevel === _targetEduLabel;

        if (matchSchool && matchEdu) {
            if (!schoolsData[targetKey][targetCategory][c.name]) {
                schoolsData[targetKey][targetCategory][c.name] = new Array(academicYears.length).fill(0).map(function() { return { male: 0, female: 0 }; });
            }
        }
    });

    // Sort courses alphabetically
    var sortedCourses = Object.keys(schoolsData[targetKey][targetCategory]).sort();
    var sortedData = {};
    sortedCourses.forEach(function(course) {
        sortedData[course] = schoolsData[targetKey][targetCategory][course];
    });
    schoolsData[targetKey][targetCategory] = sortedData;

    updateUnifiedTable();
    updateSummary();
}

// ── updateUnifiedTableHeaders ─────────────────────────────────────────────
function updateUnifiedTableHeaders() {
    const mainHeaderRow = document.getElementById('mainHeaderRow');
    const subHeaderRow = document.getElementById('subHeaderRow');
    mainHeaderRow.querySelectorAll('th:not(:first-child)').forEach(function(h) { h.remove(); });
    subHeaderRow.querySelectorAll('th').forEach(function(h) { h.remove(); });
    getVisibleYears().forEach(function(year) {
        const yearHeader = document.createElement('th');
        yearHeader.className = 'year-header' + (year === getCurrentAcademicYear() ? ' year-header-current' : '');
        yearHeader.colSpan = 3;
        yearHeader.textContent = year;
        mainHeaderRow.appendChild(yearHeader);
        const f = document.createElement('th'); f.className = 'gender-subheader female-header'; f.textContent = 'FEMALE'; subHeaderRow.appendChild(f);
        const m = document.createElement('th'); m.className = 'gender-subheader male-header'; m.textContent = 'MALE'; subHeaderRow.appendChild(m);
        const t = document.createElement('th'); t.className = 'gender-subheader total-header'; t.textContent = 'TOTAL'; subHeaderRow.appendChild(t);
    });
}

// ── updateUnifiedTable ────────────────────────────────────────────────────
function updateUnifiedTable() {
    const tableBody = document.getElementById('unifiedTableBody');

    if (!schoolsData[currentSchool]) {
        schoolsData[currentSchool] = { enrollees:{}, outside:{}, inside:{}, graduates:{}, passers:{} };
    }
    if (!schoolsData[currentSchool][currentFilter]) {
        schoolsData[currentSchool][currentFilter] = {};
    }

    tableBody.innerHTML = '';
    const fragment = document.createDocumentFragment();

    var coursesToShow;

    if (currentEducationalLevel === 'all') {
        coursesToShow = Object.keys(schoolsData[currentSchool][currentFilter]);
    } else {
        var eduMap = {
            'bachelor': 'BACHELOR DEGREE',
            'twoyear': '2-YEAR COURSE',
            'tesda': 'TESDA',
            'graduate': 'GRADUATE COURSE'
        };
        var targetEduLabel = eduMap[currentEducationalLevel];

        var filtered = courseList.filter(function(c) {
            var matchSchool = c.school === currentSchool;
            var matchEdu = !targetEduLabel || c.eduLevel === targetEduLabel;
            return matchSchool && matchEdu;
        });

        coursesToShow = filtered.map(function(c) { return c.name; });
        coursesToShow = coursesToShow.filter(function(v, i, a) { return a.indexOf(v) === i; });

        coursesToShow.forEach(function(name) {
            ['enrollees', 'outside', 'inside', 'graduates', 'passers'].forEach(function(cat) {
                if (!schoolsData[currentSchool][cat]) schoolsData[currentSchool][cat] = {};
                if (!schoolsData[currentSchool][cat][name]) {
                    schoolsData[currentSchool][cat][name] = new Array(academicYears.length).fill(0).map(function() {
                        return { male: 0, female: 0 };
                    });
                }
            });
        });
    }

    var data = schoolsData[currentSchool][currentFilter];

    coursesToShow.forEach(function(course) {
        var courseData = data[course];
        if (!courseData) return;

        var row = document.createElement('tr');
        row.className = 'course-row';

        var rowHTML = '<td><input type="checkbox" class="course-checkbox" data-course="' + alEsc(course) + '"><span class="course-name">' + alEsc(course) + '</span></td>';

        getVisibleYears().forEach(function(year) {
            var realYearIndex = academicYears.indexOf(year);
            var genderData = realYearIndex !== -1 ? courseData[realYearIndex] : null;
            var maleValue   = (genderData && typeof genderData === 'object') ? (genderData.male   || 0) : 0;
            var femaleValue = (genderData && typeof genderData === 'object') ? (genderData.female || 0) : 0;
            var totalValue  = maleValue + femaleValue;
            var safeCourse = course.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            rowHTML +=
                '<td class="gender-data-cell female"><input type="number" class="editable-input" value="' + femaleValue + '" onchange="updateGenderData(\'' + safeCourse + '\', ' + realYearIndex + ', \'female\', this.value)" min="0"></td>' +
                '<td class="gender-data-cell male"><input type="number" class="editable-input" value="' + maleValue + '" onchange="updateGenderData(\'' + safeCourse + '\', ' + realYearIndex + ', \'male\', this.value)" min="0"></td>' +
                '<td class="gender-data-cell total">' + totalValue + '</td>';
        });

        row.innerHTML = rowHTML;
        fragment.appendChild(row);
    });

    tableBody.appendChild(fragment);
}

// ── updateGenderData ──────────────────────────────────────────────────────
function updateGenderData(course, yearIndex, gender, value) {
    const newValue = parseInt(value) || 0;
    if (!schoolsData[currentSchool]) schoolsData[currentSchool] = { enrollees:{}, outside:{}, inside:{}, graduates:{}, passers:{} };
    if (!schoolsData[currentSchool][currentFilter][course]) {
        schoolsData[currentSchool][currentFilter][course] = new Array(academicYears.length).fill(0).map(function() { return {male:0, female:0}; });
    }
    if (!schoolsData[currentSchool][currentFilter][course][yearIndex]) {
        schoolsData[currentSchool][currentFilter][course][yearIndex] = {male:0, female:0};
    }
    schoolsData[currentSchool][currentFilter][course][yearIndex][gender] = newValue;

    const row = event.target.closest('tr');
    const cellIndex = Array.from(row.cells).indexOf(event.target.closest('td'));
    const yearGroupIndex = Math.floor((cellIndex - 1) / 3);
    const totalCellIndex = yearGroupIndex * 3 + 3;
    if (row.cells[totalCellIndex]) {
        const femaleV = parseInt(row.cells[totalCellIndex - 2].querySelector('input').value) || 0;
        const maleV   = parseInt(row.cells[totalCellIndex - 1].querySelector('input').value) || 0;
        row.cells[totalCellIndex].textContent = maleV + femaleV;
    }

    updateSummary();

    row.classList.add('highlight');
    setTimeout(function() { row.classList.remove('highlight'); }, 1000);

    const yearLabel = academicYears[yearIndex] || ('Year index ' + yearIndex);
    saveActivityLog((currentSchoolDoc ? currentSchoolDoc.username : 'school') + ' updated ' + course + ' | Year: ' + yearLabel + ' | ' + gender + ': ' + newValue, 'school.html');
}

// ── Year management ───────────────────────────────────────────────────────
function addNewYear() {
    const newYearInput = document.getElementById('newYearInput');
    const newYear = newYearInput.value.trim();
    if (!newYear) { showToast('Please enter a year.', 'error'); return; }
    if (academicYears.includes(newYear)) { showToast('This year already exists.', 'error'); return; }
    academicYears.push(newYear);
    Object.keys(schoolsData).forEach(function(school) {
        Object.keys(schoolsData[school]).forEach(function(cat) {
            Object.keys(schoolsData[school][cat]).forEach(function(course) {
                schoolsData[school][cat][course].push({male:0,female:0});
            });
        });
    });
    initYearWindowStart(); renderYearNavigator(); updateUnifiedTableHeaders(); updateUnifiedTable(); updateSummary();
    updateYearsList(); newYearInput.value = '';
    showToast('Year ' + newYear + ' added successfully!', 'success');
}

function deleteYear(yearIndex) {
    if (academicYears.length <= 1) { showToast('Cannot delete the last remaining year.', 'error'); return; }
    const yearToDelete = academicYears[yearIndex];
    if (confirm('Delete year ' + yearToDelete + '? All data for this year will be removed.')) {
        academicYears.splice(yearIndex, 1);
        Object.keys(schoolsData).forEach(function(school) {
            Object.keys(schoolsData[school]).forEach(function(cat) {
                Object.keys(schoolsData[school][cat]).forEach(function(course) {
                    schoolsData[school][cat][course].splice(yearIndex, 1);
                });
            });
        });
        initYearWindowStart(); renderYearNavigator(); updateUnifiedTableHeaders(); updateUnifiedTable(); updateSummary(); updateYearsList();
        showToast('Year ' + yearToDelete + ' deleted.', 'success');
    }
}

function updateYearsList() {
    const yearsList = document.getElementById('yearsList');
    if (!yearsList) return;
    yearsList.innerHTML = '';
    academicYears.forEach(function(year, index) {
        const item = document.createElement('div');
        item.className = 'year-item';
        item.innerHTML = '<span class="year-name">' + year + '</span><button class="delete-year-btn" onclick="deleteYear(' + index + ')"><i class="fas fa-trash"></i></button>';
        yearsList.appendChild(item);
    });
}

function showYearManagement() {
    const sec = document.getElementById('yearManagementSection');
    if (!sec) return;
    const vis = sec.style.display !== 'none';
    sec.style.display = vis ? 'none' : 'block';
    if (!vis) updateYearsList();
}

function toggleSelectAllCourses() {
    const selectAll = document.getElementById('selectAllCourses');
    document.querySelectorAll('.course-checkbox').forEach(function(cb) { cb.checked = selectAll.checked; });
}

function deleteSelectedCourses() {
    const checkboxes = document.querySelectorAll('.course-checkbox:checked');
    if (checkboxes.length === 0) { showToast('Please select courses to delete.', 'error'); return; }
    if (confirm('Delete ' + checkboxes.length + ' selected course(s)?')) {
        checkboxes.forEach(function(cb) {
            const course = cb.dataset.course;
            Object.keys(schoolsData[currentSchool]).forEach(function(cat) { delete schoolsData[currentSchool][cat][course]; });
        });
        updateUnifiedTable(); updateSummary();
        document.getElementById('selectAllCourses').checked = false;
    }
}

function refreshTableData() {
    const cacheKey = currentSchool + '_' + currentEducationalLevel;
    _summaryLoadCache[cacheKey] = false;
    // Tear down and re-establish the real-time listener to force a fresh fetch
    setupDataAnalyticsListener();
    loadSummaryStatsFromFirestore();
    saveActivityLog((currentSchoolDoc ? currentSchoolDoc.username : 'school') + ' refreshed the data table.', 'school.html');
}

// Block save when edu='all' or category='enrollees'
function saveData() {
    const saveBtn = event.target;
    const originalText = saveBtn.innerHTML;

    if (currentEducationalLevel === 'all') {
        showToast('Please select a specific Educational Attainment before saving.', 'error');
        return;
    }
    if (currentFilter === 'enrollees' && document.getElementById('categoryFilter').value === 'enrollees') {
        showToast('Please choose a category before saving.', 'error');
        return;
    }

    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveBtn.disabled = true;
    saveAllDataToFirebase().then(function() {
        saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
        showToast('All data saved successfully!', 'success');
        saveActivityLog((currentSchoolDoc ? currentSchoolDoc.username : 'school') + ' saved school data.', 'school.html');
        setTimeout(function() { saveBtn.innerHTML = originalText; saveBtn.disabled = false; }, 2000);
    }).catch(function(err) {
        console.error('saveData error:', err);
        saveBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error!';
        showToast('Error saving data to database', 'error');
        setTimeout(function() { saveBtn.innerHTML = originalText; saveBtn.disabled = false; }, 2000);
    });
}

async function saveAllDataToFirebase() {
    const catVal = document.getElementById('categoryFilter').value;
    if (catVal === 'enrollees') throw new Error('Please choose a category before saving.');
    if (currentEducationalLevel === 'all') throw new Error('Please select an Educational Attainment before saving.');
    const data = schoolsData[currentSchool] && schoolsData[currentSchool][currentFilter] ? schoolsData[currentSchool][currentFilter] : {};
    const categoryMap = { enrollees:'N/A', outside:'OutsideBataan', inside:'InsideBataan', graduates:'Graduates', passers:'NumberofBoardPasser' };
    const eduMap = { bachelor:'BACHELOR DEGREE', twoyear:'2-YEAR COURSE', tesda:'TESDA', graduate:'GRADUATE COURSE' };
    const category = categoryMap[catVal] || 'N/A';
    const educationalAttainment = eduMap[currentEducationalLevel] || 'N/A';
    const promises = [];
    Object.keys(data).forEach(function(courseName) {
        data[courseName].forEach(function(genderData, yearIndex) {
            const year = academicYears[yearIndex];
            if (!year) return;
            const male   = (genderData && typeof genderData === 'object') ? (genderData.male   || 0) : 0;
            const female = (genderData && typeof genderData === 'object') ? (genderData.female || 0) : 0;
            if (male > 0 || female > 0) {
                promises.push(saveToDataAnalytics(currentSchool, year, courseName, category, male, female, educationalAttainment));
            }
        });
    });
    await Promise.all(promises);
}

// ── Firestore Data_Analytics ──────────────────────────────────────────────
// FriendlyID uses a local counter seeded at startup from a small summary query
function getNextFriendlyId() { friendlyIdCounter++; return friendlyIdCounter; }

function getSchoolAbbreviation(schoolId) {
    const s = allSchoolDocs.find(function(s) { return s.docId === schoolId; });
    if (s) return s.schoolabbrev;
    if (currentSchoolDoc && currentSchoolDoc.schoolabbrev) return currentSchoolDoc.schoolabbrev;
    return 'UNKNOWN';
}
function getCourseAbbreviation(courseName) {
    const words = courseName.split(' ');
    if (words.length === 1) return courseName.substring(0, 4).toUpperCase();
    return words.map(function(w) { return w.charAt(0).toUpperCase(); }).join('').substring(0, 6);
}

// Uses set() with merge:true — eliminates the extra .get() read before every save
async function saveToDataAnalytics(schoolId, year, courseName, category, maleCount, femaleCount, educationalAttainment) {
    try {
        const schoolAbbrev = getSchoolAbbreviation(schoolId);
        const courseAbbrev = getCourseAbbreviation(courseName);
        const docId = schoolAbbrev + '_' + year + '_' + courseAbbrev + '_' + category;
        const dataToSave = {
            CATEGORY: category, COURSE: courseName, EDUCATIONAL_ATTAINMENT: educationalAttainment,
            YEAR: year, MALE: parseInt(maleCount) || 0, FEMALE: parseInt(femaleCount) || 0,
            TIMESTAMP: firebase.firestore.FieldValue.serverTimestamp(), SchoolID: schoolId
        };
        await db.collection('Data_Analytics').doc(docId).set(dataToSave, { merge: true });
        return true;
    } catch (e) { console.error('saveToDataAnalytics error:', e); return false; }
}

// ── loadCoursesFromFirestore (with caching) ───────────────────────────────
async function loadCoursesFromFirestore() {
    if (!currentSchool || currentSchool === 'all') return;

    const cacheKey = currentSchool + '_' + currentEducationalLevel;
    if (_courseLoadCache[cacheKey]) {
        updateUnifiedTable();
        updateSummary();
        return;
    }

    try {
        const eduMap = { bachelor:'BACHELOR DEGREE', twoyear:'2-YEAR COURSE', tesda:'TESDA', graduate:'GRADUATE COURSE' };
        const targetEduLabel = eduMap[currentEducationalLevel];

        courseList = courseList.filter(function(c) {
            if (c.school !== currentSchool) return true;
            if (currentEducationalLevel === 'all') return false;
            return c.eduLevel !== targetEduLabel;
        });

        let query = db.collection('COURSE').where('deletestats','==',0).where('School','==',currentSchool);
        if (currentEducationalLevel !== 'all') query = query.where('EducationalAttainment','==',targetEduLabel);
        const snap = await query.get();
        snap.forEach(function(doc) {
            const d = doc.data();
            const targetKey = d.School || 'all';
            if (!schoolsData[targetKey]) schoolsData[targetKey] = { enrollees:{}, outside:{}, inside:{}, graduates:{}, passers:{} };
            ['enrollees','outside','inside','graduates','passers'].forEach(function(cat) {
                if (!schoolsData[targetKey][cat][d.SchoolCourse]) {
                    schoolsData[targetKey][cat][d.SchoolCourse] = new Array(academicYears.length).fill(0).map(function() { return {male:0,female:0}; });
                }
            });
            const already = courseList.find(function(c) { return c.name === d.SchoolCourse && c.school === d.School; });
            if (!already) courseList.push({ id: doc.id, name: d.SchoolCourse, school: d.School, schoolLabel: d.SchoolName || '', eduLevel: d.EducationalAttainment || '' });
        });

        _courseLoadCache[cacheKey] = true;
        updateUnifiedTable(); updateSummary();
    } catch (e) { console.error('loadCoursesFromFirestore error:', e); }
}

// ── Course List Section (Add Course page) ─────────────────────────────────
let clAllCourses = [];
let clFiltered = [];
let clPage = 1;
const clPageSize = 10;

async function clLoadCoursesFromFirestore() {
    try {
        const schoolDocId = getSchoolDocId();
        let query = db.collection('COURSE').where('deletestats', '==', 0);
        if (schoolDocId) query = query.where('School', '==', schoolDocId);
        const snap = await query.get();
        clAllCourses = snap.docs.map(function(doc) {
            const d = doc.data();
            return { docId: doc.id, courseName: d.SchoolCourse || '', schoolName: d.SchoolName || '', schoolAbbrev: d.SchoolAbbrev || '', schoolDocId: d.School || '', eduLevel: d.EducationalAttainment || '' };
        });
        clAllCourses.sort(function(a, b) { return a.courseName.localeCompare(b.courseName); });
        clFilterCourses();
    } catch (e) { console.error('clLoadCoursesFromFirestore error:', e); }
}

function clFilterCourses() {
    const search = (document.getElementById('clSearchInput') ? document.getElementById('clSearchInput').value : '').toLowerCase();
    const eduVal = document.getElementById('clEduFilter') ? document.getElementById('clEduFilter').value : 'all';
    clFiltered = clAllCourses.filter(function(c) {
        const matchSearch = !search || c.courseName.toLowerCase().includes(search) || c.schoolName.toLowerCase().includes(search);
        const matchEdu = eduVal === 'all' || c.eduLevel === eduVal;
        return matchSearch && matchEdu;
    });
    clPage = 1;
    clRenderTable();
}

function clRenderTable() {
    const tbody = document.getElementById('clTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const total = clFiltered.length;
    const totalPages = Math.max(1, Math.ceil(total / clPageSize));
    if (clPage > totalPages) clPage = totalPages;
    const start = (clPage - 1) * clPageSize;
    const end = Math.min(start + clPageSize, total);
    const pageData = clFiltered.slice(start, end);
    if (pageData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-gray);">No courses found. <a href="#" onclick="openAddCourseModal()" style="color:var(--primary-blue);">Add a course</a>.</td></tr>';
    } else {
        pageData.forEach(function(c, i) {
            const tr = document.createElement('tr');
            const _cNum = document.createElement('td'); _cNum.textContent = start + i + 1;
            const _cName = document.createElement('td'); _cName.innerHTML = '<strong>' + alEsc(c.courseName || '—') + '</strong>';
            const _cSchool = document.createElement('td'); _cSchool.textContent = c.schoolName || '—';
            const _cEdu = document.createElement('td'); _cEdu.innerHTML = '<span style="background:#f0f9ff;color:#0369a1;padding:2px 8px;border-radius:6px;font-size:0.82rem;font-weight:600;">' + alEsc(c.eduLevel || '—') + '</span>';
            const _cAct = document.createElement('td'); _cAct.style.whiteSpace = 'nowrap';
            const _cActCell = document.createElement('div'); _cActCell.className = 'action-cell';
            const _cEdit = document.createElement('button');
            _cEdit.className = 'btn btn-secondary btn-small'; _cEdit.title = 'Edit'; _cEdit.innerHTML = '<i class="fas fa-edit"></i> Edit';
            _cEdit.onclick = (function(d) { return function() { openEditCourseFromCL(d); }; })(c.docId);
            const _cDel = document.createElement('button');
            _cDel.className = 'btn btn-danger btn-small'; _cDel.title = 'Delete'; _cDel.innerHTML = '<i class="fas fa-trash"></i> Delete';
            _cDel.onclick = (function(d, n) { return function() { deleteCourseFromCL(d, n); }; })(c.docId, c.courseName || '');
            _cActCell.appendChild(_cEdit); _cActCell.appendChild(_cDel); _cAct.appendChild(_cActCell);
            [_cNum, _cName, _cSchool, _cEdu, _cAct].forEach(function(td) { tr.appendChild(td); });
            tbody.appendChild(tr);
        });
    }
    const pageInfo = document.getElementById('clPageInfo');
    const pageIndicator = document.getElementById('clPageIndicator');
    const prevBtn = document.getElementById('clPrevBtn');
    const nextBtn = document.getElementById('clNextBtn');
    if (pageInfo) pageInfo.textContent = total === 0 ? 'No courses found' : 'Showing ' + (start + 1) + '-' + end + ' of ' + total + ' courses';
    if (pageIndicator) pageIndicator.textContent = 'Page ' + clPage + ' of ' + totalPages;
    if (prevBtn) prevBtn.disabled = clPage <= 1;
    if (nextBtn) nextBtn.disabled = clPage >= totalPages;
}

function clPrevPage() { if (clPage > 1) { clPage--; clRenderTable(); } }
function clNextPage() { const totalPages = Math.max(1, Math.ceil(clFiltered.length / clPageSize)); if (clPage < totalPages) { clPage++; clRenderTable(); } }
function openEditCourseFromCL(docId) { openEditCourse(docId); }

async function deleteCourseFromCL(docId, courseName) {
    if (confirm('Delete course "' + courseName + '"? This cannot be undone.')) {
        try {
            await db.collection('COURSE').doc(docId).update({ deletestats: 1 });
            showToast('Course deleted successfully!', 'success');
            clAllCourses = clAllCourses.filter(function(c) { return c.docId !== docId; });
            clFilterCourses();
            _courseLoadCache = {};
            saveActivityLog((currentSchoolDoc ? currentSchoolDoc.username : 'school') + ' deleted course "' + courseName + '".', 'school.html');
        } catch (e) { console.error('deleteCourseFromCL error:', e); showToast('Error deleting course', 'error'); }
    }
}

// ── Add Course Modal ──────────────────────────────────────────────────────
function openAddCourseModal() {
    const schoolDocId = getSchoolDocId();
    const schoolName = currentSchoolDoc ? (currentSchoolDoc.schoolname || '') : '';
    const displayInput = document.getElementById('modalCourseSchoolDisplay');
    const hiddenInput = document.getElementById('modalCourseSchool');
    if (displayInput) displayInput.value = schoolName;
    if (hiddenInput) hiddenInput.value = schoolDocId;
    document.getElementById('addCourseModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeAddCourseModal() {
    document.getElementById('addCourseModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('sidebarAddCourseForm').reset();
    const schoolDocId = getSchoolDocId();
    const schoolName = currentSchoolDoc ? (currentSchoolDoc.schoolname || '') : '';
    const displayInput = document.getElementById('modalCourseSchoolDisplay');
    const hiddenInput = document.getElementById('modalCourseSchool');
    if (displayInput) displayInput.value = schoolName;
    if (hiddenInput) hiddenInput.value = schoolDocId;
}

// getNextCourseId — avoid full collection scan by using timestamp suffix
async function getNextCourseId(schoolAbbrev, eduAttainment) {
    const safeSchool = schoolAbbrev.replace(/[^a-zA-Z0-9]/g, '');
    const safeEdu = eduAttainment.replace(/[^a-zA-Z0-9]/g, '_');
    const prefix = safeSchool + '_' + safeEdu;
    // Only scan the school's own courses, not the entire COURSE collection
    const snap = await db.collection('COURSE')
        .where('School', '==', getSchoolDocId())
        .where('EducationalAttainment', '==', eduAttainment)
        .get();
    let max = 0;
    snap.forEach(function(doc) {
        if (doc.id.startsWith(prefix + '_')) {
            const num = parseInt(doc.id.substring(prefix.length + 1));
            if (!isNaN(num)) max = Math.max(max, num);
        }
    });
    return prefix + '_' + String(max + 1).padStart(4, '0');
}

async function submitAddCourseModal(event) {
    event.preventDefault();
    const schoolDocId = getSchoolDocId();
    const schoolLabel = currentSchoolDoc ? (currentSchoolDoc.schoolname || '') : '';
    const schoolAbbrev = currentSchoolDoc ? (currentSchoolDoc.schoolabbrev || schoolLabel) : '';
    const eduLevel = document.getElementById('modalEduAttainment').value;
    const courseName = document.getElementById('modalCourseName').value.trim();
    if (!courseName || !eduLevel || !schoolDocId) return;
    const dupSnap = await db.collection('COURSE')
        .where('School', '==', schoolDocId).where('EducationalAttainment', '==', eduLevel)
        .where('SchoolCourse', '==', courseName).where('deletestats', '==', 0).get();
    if (!dupSnap.empty) { showToast('Course already exists for this school and educational level!', 'error'); return; }
    const docId = await getNextCourseId(schoolAbbrev, eduLevel);
    const courseIdNum = docId.split('_').pop();
    await db.collection('COURSE').doc(docId).set({
        SchoolCourse: courseName,
        AddedBy: currentSchoolDoc ? currentSchoolDoc.username : 'school',
        TimeStamp: firebase.firestore.FieldValue.serverTimestamp(),
        CourseID: courseIdNum,
        EducationalAttainment: eduLevel,
        School: schoolDocId,
        SchoolName: schoolLabel,
        SchoolAbbrev: schoolAbbrev,
        deletestats: 0
    });
    if (!schoolsData[schoolDocId]) schoolsData[schoolDocId] = { enrollees:{}, outside:{}, inside:{}, graduates:{}, passers:{} };
    ['enrollees','outside','inside','graduates','passers'].forEach(function(cat) {
        schoolsData[schoolDocId][cat][courseName] = new Array(academicYears.length).fill(0).map(function() { return {male:0,female:0}; });
    });
    courseList.push({ id: Date.now(), name: courseName, school: schoolDocId, schoolLabel: schoolLabel, eduLevel: eduLevel });
    _courseLoadCache = {};
    updateUnifiedTable(); updateSummary();
    showToast('"' + courseName + '" added successfully!', 'success');
    saveActivityLog((currentSchoolDoc ? currentSchoolDoc.username : 'school') + ' added course "' + courseName + '" (' + eduLevel + ').', 'school.html');
    closeAddCourseModal();
    clLoadCoursesFromFirestore();
}

// ── Edit Course ───────────────────────────────────────────────────────────
async function openEditCourse(courseDocId) {
    try {
        const snap = await db.collection('COURSE').doc(courseDocId).get();
        if (!snap.exists) { showToast('Course not found!', 'error'); return; }
        const d = snap.data();
        document.getElementById('editCourseDocId').value = courseDocId;
        document.getElementById('editCourseName').value = d.SchoolCourse || '';
        document.getElementById('editCourseEdu').value = d.EducationalAttainment || '';
        document.getElementById('editCourseModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    } catch (e) { console.error('openEditCourse error:', e); showToast('Error loading course data', 'error'); }
}

function closeEditCourseModal() {
    document.getElementById('editCourseModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

async function saveEditCourse() {
    try {
        const docId = document.getElementById('editCourseDocId').value;
        const courseName = document.getElementById('editCourseName').value.trim();
        const eduLevel = document.getElementById('editCourseEdu').value;
        const schoolDocId = getSchoolDocId();
        if (!courseName || !eduLevel) { showToast('Please fill in all fields', 'error'); return; }
        const dupSnap = await db.collection('COURSE')
            .where('School', '==', schoolDocId).where('EducationalAttainment', '==', eduLevel)
            .where('SchoolCourse', '==', courseName).where('deletestats', '==', 0).get();
        for (let i = 0; i < dupSnap.docs.length; i++) {
            if (dupSnap.docs[i].id !== docId) { showToast('This course already exists for this school and level!', 'error'); return; }
        }
        await db.collection('COURSE').doc(docId).update({ SchoolCourse: courseName, EducationalAttainment: eduLevel });
        showToast('Course updated successfully!', 'success');
        closeEditCourseModal();
        _courseLoadCache = {};
        clLoadCoursesFromFirestore();
        loadCoursesFromFirestore();
        saveActivityLog((currentSchoolDoc ? currentSchoolDoc.username : 'school') + ' edited course "' + courseName + '".', 'school.html');
    } catch (e) { console.error('saveEditCourse error:', e); showToast('Error saving course: ' + e.message, 'error'); }
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────
let _pendingDeleteFn = null;
function showDeleteConfirm(title, message, onConfirm) {
    document.getElementById('dcmTitle').textContent = title;
    document.getElementById('dcmMsg').textContent = message;
    _pendingDeleteFn = onConfirm;
    document.getElementById('deleteConfirmModal').classList.add('open');
}
function closeDeleteConfirm() { document.getElementById('deleteConfirmModal').classList.remove('open'); _pendingDeleteFn = null; }
function confirmDeleteAction() {
    document.getElementById('deleteConfirmModal').classList.remove('open');
    if (typeof _pendingDeleteFn === 'function') _pendingDeleteFn();
    _pendingDeleteFn = null;
}

// ── Password toggle ───────────────────────────────────────────────────────
function toggleInputPassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isText = input.type === 'text';
    input.type = isText ? 'password' : 'text';
    const icon = btn.querySelector('i');
    if (icon) icon.className = isText ? 'fas fa-eye' : 'fas fa-eye-slash';
}

// ── School Profile ────────────────────────────────────────────────────────
let _profileDocId = '';
let _profileOriginalData = {};

async function loadSchoolProfile() {
    const schoolDocId = getSchoolDocId();
    if (!schoolDocId) return;
    try {
        const snap = await db.collection('ListofSchool').doc(schoolDocId).get();
        if (!snap.exists) { showToast('School profile not found.', 'error'); return; }
        const d = snap.data();
        _profileDocId = schoolDocId;
        _profileOriginalData = d;
        document.getElementById('profileSchoolName').textContent = d.schoolname || '—';
        document.getElementById('profileSchoolAbbrev').textContent = d.schoolabbrev || '—';
        document.getElementById('profSchoolName').value = d.schoolname || '';
        document.getElementById('profSchoolAbbrev').value = d.schoolabbrev || '';
        document.getElementById('profSchoolPres').value = d.schoolpres || '';
        document.getElementById('profAddress').value = d.address || '';
        document.getElementById('profEmail').value = d.email_add || '';
        document.getElementById('profPhone').value = d.contact_number || '';
        document.getElementById('profLandline').value = d.landline || '';
        document.getElementById('profWebsite').value = d.website || '';
        document.getElementById('profTeachingStaff').value = d.teaching_staff || 0;
        document.getElementById('profNonTeachingStaff').value = d.nonteachingstaff || 0;
        document.getElementById('profUsername').value = d.username || '';
        document.getElementById('profPassword').value = d.password || '';
        document.getElementById('profDescription').value = d.description || '';
    } catch (e) { console.error('loadSchoolProfile error:', e); showToast('Error loading profile.', 'error'); }
}

function enableProfileEdit() {
    const fields = ['profSchoolName','profSchoolAbbrev','profSchoolPres','profAddress','profEmail','profPhone','profLandline','profWebsite','profTeachingStaff','profNonTeachingStaff','profUsername','profPassword','profDescription'];
    fields.forEach(function(id) { const el = document.getElementById(id); if (el) el.removeAttribute('disabled'); });
    document.getElementById('editProfileBtn').style.display = 'none';
    document.getElementById('saveProfileBtn').style.display = '';
    document.getElementById('cancelProfileBtn').style.display = '';
}

function cancelProfileEdit() {
    const d = _profileOriginalData;
    document.getElementById('profSchoolName').value = d.schoolname || '';
    document.getElementById('profSchoolAbbrev').value = d.schoolabbrev || '';
    document.getElementById('profSchoolPres').value = d.schoolpres || '';
    document.getElementById('profAddress').value = d.address || '';
    document.getElementById('profEmail').value = d.email_add || '';
    document.getElementById('profPhone').value = d.contact_number || '';
    document.getElementById('profLandline').value = d.landline || '';
    document.getElementById('profWebsite').value = d.website || '';
    document.getElementById('profTeachingStaff').value = d.teaching_staff || 0;
    document.getElementById('profNonTeachingStaff').value = d.nonteachingstaff || 0;
    document.getElementById('profUsername').value = d.username || '';
    document.getElementById('profPassword').value = d.password || '';
    document.getElementById('profDescription').value = d.description || '';
    disableProfileFields();
}

function disableProfileFields() {
    const fields = ['profSchoolName','profSchoolAbbrev','profSchoolPres','profAddress','profEmail','profPhone','profLandline','profWebsite','profTeachingStaff','profNonTeachingStaff','profUsername','profPassword','profDescription'];
    fields.forEach(function(id) { const el = document.getElementById(id); if (el) el.setAttribute('disabled', 'disabled'); });
    document.getElementById('editProfileBtn').style.display = '';
    document.getElementById('saveProfileBtn').style.display = 'none';
    document.getElementById('cancelProfileBtn').style.display = 'none';
}

async function saveSchoolProfile() {
    const docId = _profileDocId;
    if (!docId) { showToast('No school profile loaded.', 'error'); return; }
    const schoolname      = document.getElementById('profSchoolName').value.trim();
    const schoolabbrev    = document.getElementById('profSchoolAbbrev').value.trim();
    const schoolpres      = document.getElementById('profSchoolPres').value.trim();
    const address         = document.getElementById('profAddress').value.trim();
    const email_add       = document.getElementById('profEmail').value.trim();
    const contact_number  = document.getElementById('profPhone').value.trim();
    const landline        = document.getElementById('profLandline').value.trim();
    const website         = document.getElementById('profWebsite').value.trim();
    const teaching_staff  = parseInt(document.getElementById('profTeachingStaff').value) || 0;
    const nonteachingstaff = parseInt(document.getElementById('profNonTeachingStaff').value) || 0;
    const username        = document.getElementById('profUsername').value.trim();
    const password        = document.getElementById('profPassword').value;
    const description     = document.getElementById('profDescription').value.trim();
    if (!schoolname) { showToast('School name is required.', 'error'); return; }
    const saveBtn = document.getElementById('saveProfileBtn');
    const orig = saveBtn.innerHTML;
    saveBtn.disabled = true; saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    try {
        await db.collection('ListofSchool').doc(docId).update({ schoolname, schoolabbrev, schoolpres, address, email_add, contact_number, landline, website, teaching_staff, nonteachingstaff, username, password, description });
        _profileOriginalData = Object.assign({}, _profileOriginalData, { schoolname, schoolabbrev, schoolpres, address, email_add, contact_number, landline, website, teaching_staff, nonteachingstaff, username, password, description });
        document.getElementById('profileSchoolName').textContent = schoolname;
        document.getElementById('profileSchoolAbbrev').textContent = schoolabbrev;
        if (currentSchoolDoc) { currentSchoolDoc.schoolname = schoolname; currentSchoolDoc.schoolabbrev = schoolabbrev; currentSchoolDoc.username = username; currentSchoolDoc.password = password; }
        showToast('School profile updated successfully!', 'success');
        saveActivityLog((currentSchoolDoc ? currentSchoolDoc.username : 'school') + ' updated school profile.', 'school.html');
        disableProfileFields();
    } catch (e) {
        console.error('saveSchoolProfile error:', e);
        showToast('Error saving profile: ' + e.message, 'error');
    } finally { saveBtn.disabled = false; saveBtn.innerHTML = orig; }
}

// ── Settings ──────────────────────────────────────────────────────────────
async function loadSchoolSettingsForm() {
    const schoolDocId = getSchoolDocId();
    if (!schoolDocId) return;
    try {
        const snap = await db.collection('SchoolSettings').doc(schoolDocId).get();
        if (snap.exists) {
            const d = snap.data();
            const el = document.getElementById('schoolBackupFreq');
            if (el && d.BackupFrequency) el.value = d.BackupFrequency;
        }
    } catch (e) { console.error('loadSchoolSettingsForm error:', e); }
}

let _schoolSettingsSaving = false;
async function saveSchoolSettings() {
    if (_schoolSettingsSaving) return;
    const schoolDocId = getSchoolDocId();
    const backupFreq = document.getElementById('schoolBackupFreq').value;
    _schoolSettingsSaving = true;
    const saveBtn = document.querySelector('#settings .btn-primary');
    const orig = saveBtn ? saveBtn.innerHTML : '';
    if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'; }
    try {
        await db.collection('SchoolSettings').doc(schoolDocId).set({ BackupFrequency: backupFreq }, { merge: true });
        showToast('Settings saved successfully!', 'success');
        if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
        saveActivityLog((currentSchoolDoc ? currentSchoolDoc.username : 'school') + ' updated school settings.', 'school.html');
        if (backupFreq === 'daily') checkAndRunDailyBackup();
        else if (backupFreq === 'weekly') checkAndRunWeeklyBackup();
        else if (backupFreq === 'monthly') checkAndRunMonthlyBackup();
        setTimeout(function() { if (saveBtn) { saveBtn.innerHTML = orig; saveBtn.disabled = false; } _schoolSettingsSaving = false; }, 2000);
    } catch (e) {
        console.error('saveSchoolSettings error:', e);
        showToast('Error saving settings: ' + e.message, 'error');
        if (saveBtn) { saveBtn.innerHTML = orig; saveBtn.disabled = false; }
        _schoolSettingsSaving = false;
    }
}

async function submitProblemReport() {
    const text = (document.getElementById('reportProblemText').value || '').trim();
    if (!text) { showToast('Please describe the problem first.', 'error'); return; }
    const schoolDocId = getSchoolDocId();
    try {
        await db.collection('ProblemReports').add({
            SchoolID: schoolDocId,
            SchoolName: currentSchoolDoc ? currentSchoolDoc.schoolname : '',
            Username: currentSchoolDoc ? currentSchoolDoc.username : '',
            Description: text,
            TimeStamp: firebase.firestore.FieldValue.serverTimestamp(),
            Status: 'open'
        });
        showToast('Report submitted successfully. We will review it shortly.', 'success');
        document.getElementById('reportProblemText').value = '';
        saveActivityLog((currentSchoolDoc ? currentSchoolDoc.username : 'school') + ' submitted a problem report.', 'school.html');
    } catch (e) { console.error('submitProblemReport error:', e); showToast('Error submitting report: ' + e.message, 'error'); }
}

// ── Backup ────────────────────────────────────────────────────────────────
async function checkAndRunDailyBackup() {
    const today = new Date().toISOString().slice(0, 10);
    const key = 'schoolLastBackupDate_' + getSchoolDocId();
    if (localStorage.getItem(key) === today) return;
    await runSchoolBackup();
    localStorage.setItem(key, today);
}
async function checkAndRunWeeklyBackup() {
    const now = new Date();
    const weekNum = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));
    const key = 'schoolLastBackupWeek_' + getSchoolDocId();
    if (localStorage.getItem(key) === String(weekNum)) return;
    await runSchoolBackup();
    localStorage.setItem(key, String(weekNum));
}
async function checkAndRunMonthlyBackup() {
    const now = new Date();
    const monthKey = now.getFullYear() + '-' + (now.getMonth() + 1);
    const key = 'schoolLastBackupMonth_' + getSchoolDocId();
    if (localStorage.getItem(key) === monthKey) return;
    await runSchoolBackup();
    localStorage.setItem(key, monthKey);
}

function sanitizeFirestoreData(data) {
    if (data === null || data === undefined) return null;
    if (typeof data !== 'object') return data;
    if (Array.isArray(data)) return data.map(sanitizeFirestoreData);
    const out = {};
    Object.keys(data).forEach(function(k) {
        const v = data[k];
        if (v && typeof v === 'object' && typeof v.toDate === 'function') out[k] = v.toDate().toISOString();
        else if (v && typeof v === 'object' && v._seconds !== undefined) out[k] = new Date(v._seconds * 1000).toISOString();
        else out[k] = sanitizeFirestoreData(v);
    });
    return out;
}

async function runSchoolBackup() {
    try {
        showToast('Preparing backup...', 'success');
        const schoolDocId = getSchoolDocId();
        const backupData = {};
        const snap1 = await db.collection('Data_Analytics').where('SchoolID', '==', schoolDocId).get();
        backupData['Data_Analytics'] = {};
        snap1.forEach(function(doc) { backupData['Data_Analytics'][doc.id] = sanitizeFirestoreData(doc.data()); });
        const snap2 = await db.collection('COURSE').where('School', '==', schoolDocId).where('deletestats', '==', 0).get();
        backupData['COURSE'] = {};
        snap2.forEach(function(doc) { backupData['COURSE'][doc.id] = sanitizeFirestoreData(doc.data()); });
        const snap3 = await db.collection('ActivityLog').where('UserID', '==', schoolDocId).get();
        backupData['ActivityLog'] = {};
        snap3.forEach(function(doc) { backupData['ActivityLog'][doc.id] = sanitizeFirestoreData(doc.data()); });
        const now = new Date();
        const pad = function(n) { return n < 10 ? '0' + n : String(n); };
        const dateStr = now.getFullYear() + '' + pad(now.getMonth() + 1) + '' + pad(now.getDate());
        const abbrev = currentSchoolDoc ? (currentSchoolDoc.schoolabbrev || 'school') : 'school';
        const filename = 'school_backup_' + abbrev + '_' + dateStr + '.json';
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        showToast('Backup complete! Saved to ' + filename, 'success');
    } catch (e) { console.error('runSchoolBackup error:', e); showToast('Backup failed: ' + e.message, 'error'); }
}

// ── Export ────────────────────────────────────────────────────────────────
function exportTableData() {
    const schoolLabel = currentSchoolDoc ? (currentSchoolDoc.schoolname || 'School') : 'School';
    const eduSelect = document.getElementById('educationalFilter');
    const eduLabel = eduSelect ? eduSelect.options[eduSelect.selectedIndex].text : 'N/A';
    const catSelect = document.getElementById('categoryFilter');
    const catLabel = catSelect ? catSelect.options[catSelect.selectedIndex].text : 'All';
    const exportYears = getVisibleYears();
    function colToLetter(n) { let s=''; while(n>0){n--;s=String.fromCharCode(65+(n%26))+s;n=Math.floor(n/26);} return s; }
    const totalCols = 1 + exportYears.length * 3;
    const lastCol = colToLetter(totalCols);
    const colMaxLen = new Array(totalCols).fill(10);
    const dataRows = [];
    document.querySelectorAll('#unifiedTableBody tr').forEach(function(row) {
        if (row.style.display === 'none') return;
        const dr = [];
        const cnEl = row.querySelector('.course-name');
        const cn = cnEl ? cnEl.textContent.trim() : '';
        dr.push(cn); colMaxLen[0] = Math.max(colMaxLen[0], cn.length + 2);
        exportYears.forEach(function(year, yi) {
            const realYearIndex = academicYears.indexOf(year);
            let maleVal=0, femaleVal=0;
            try {
                const gd = (realYearIndex !== -1 && schoolsData[currentSchool] && schoolsData[currentSchool][currentFilter] && schoolsData[currentSchool][currentFilter][cn]) ? schoolsData[currentSchool][currentFilter][cn][realYearIndex] : null;
                maleVal = (gd && typeof gd === 'object') ? (gd.male||0) : 0;
                femaleVal = (gd && typeof gd === 'object') ? (gd.female||0) : 0;
            } catch(e){}
            dr.push(maleVal, femaleVal, maleVal+femaleVal);
        });
        dataRows.push(dr);
    });
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Student Data');
    ws.addRow(['Utown Data Name - ' + schoolLabel]);
    ws.mergeCells('A1:' + lastCol + '1');
    const r1 = ws.getCell('A1'); r1.font={bold:true,size:16}; r1.alignment={horizontal:'center',vertical:'middle'};
    ws.addRow([]);
    ws.getCell('A2').value='School: '+schoolLabel; ws.mergeCells('A2:B2'); ws.getCell('A2').font={bold:true,size:14}; ws.getCell('A2').alignment={horizontal:'center',vertical:'middle'};
    const rowAValues=['Course Name']; exportYears.forEach(function(y){rowAValues.push(y,'','');}); ws.addRow(rowAValues);
    ws.mergeCells('A3:A4');
    exportYears.forEach(function(year,yi){const sc=2+yi*3,ec=sc+2,sl=colToLetter(sc),el=colToLetter(ec);ws.mergeCells(sl+'3:'+el+'3');const yc=ws.getCell(sl+'3');yc.value=year;yc.font={bold:true,size:13};yc.alignment={horizontal:'center',vertical:'middle'};});
    const rowBValues=[''];exportYears.forEach(function(){rowBValues.push('MALE','FEMALE','TOTAL');});ws.addRow(rowBValues);
    dataRows.forEach(function(dr){ws.addRow(dr);});
    ws.eachRow(function(row,rn){row.eachCell({includeEmpty:true},function(cell){cell.border={top:{style:'thin'},left:{style:'thin'},bottom:{style:'thin'},right:{style:'thin'}};if(rn<=2)cell.font=Object.assign({},cell.font||{},{bold:true,color:{argb:'FFFFFFFF'}});});});
    for(let i=0;i<totalCols;i++){ws.getColumn(i+1).width=i===0?Math.max(colMaxLen[i],30):Math.max(Math.ceil(colMaxLen[i]*1.5),20);}
    const now=new Date(),pad=function(n){return n<10?'0'+n:String(n);};
    const dateStr=now.getFullYear()+''+pad(now.getMonth()+1)+''+pad(now.getDate())+'_'+pad(now.getHours())+''+pad(now.getMinutes());
    const safeSchool=(currentSchoolDoc?currentSchoolDoc.schoolabbrev:'school').replace(/[^a-zA-Z0-9]/g,'');
    const filename='School_'+safeSchool+'_'+dateStr+'.xlsx';
    workbook.xlsx.writeBuffer().then(function(buffer){
        const blob=new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
        const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;
        document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(a.href);
        saveActivityLog((currentSchoolDoc?currentSchoolDoc.username:'school')+' exported data to Excel.','school.html');
    });
}

// ── Load System Settings ──────────────────────────────────────────────────
async function loadSystemSettings() {
    try {
        const doc = await db.collection('Settings').doc('SystemName').get();
        if (doc.exists) {
            const val = doc.data().value;
            if (val) {
                const navEl = document.getElementById('navSiteName');
                if (navEl) navEl.textContent = val;
                document.title = (currentSchoolDoc ? currentSchoolDoc.schoolname : 'School') + ' Dashboard - ' + val;
            }
        }
        const docEmail = await db.collection('Settings').doc('AdminEmail').get();
        if (docEmail.exists && docEmail.data().value) {
            const emailEl = document.getElementById('contactAdminEmail');
            if (emailEl) emailEl.textContent = docEmail.data().value;
        }
    } catch (e) { console.error('loadSystemSettings error:', e); }
}

// ── Load School Docs ──────────────────────────────────────────────────────
async function loadSchoolAccounts() {
    try {
        const snap = await db.collection('ListofSchool').where('deletestats', '==', 0).get();
        allSchoolDocs = [];
        snap.forEach(function(doc) { allSchoolDocs.push(Object.assign({ docId: doc.id }, doc.data())); });
    } catch (e) { console.error('loadSchoolAccounts error:', e); }
}

// =============================================
// ACTIVITY LOG MODULE (school-scoped)
// =============================================
const activityLogState = {
    allDocs: [], filtered: [], currentPage: 1, perPage: 10,
    sortAsc: false, searchQuery: '', filterUsername: '', isLoading: false, initialized: false
};

async function initActivityLog() {
    if (activityLogState.isLoading) return;
    activityLogState.isLoading = true;
    showActivityLogState('loading');
    spinRefreshBtn(true);
    activityLogState.initialized = false;
    try {
        const schoolDocId = getSchoolDocId();
        // Scoped query — only this school's logs, not the entire collection
        const snapshot = await db.collection('ActivityLog')
            .where('UserID', '==', schoolDocId)
            .orderBy('TimeStamp', 'desc')
            .get();
        activityLogState.allDocs = snapshot.docs.map(function(doc) {
            return Object.assign({ id: doc.id }, doc.data());
        });
        populateActivityLogDropdowns();
        applyActivityLogFilters();
        activityLogState.initialized = true;
    } catch (err) {
        console.error('[ActivityLog] error:', err);
        showActivityLogState('error', err.message || 'Failed to load activity logs.');
    } finally {
        activityLogState.isLoading = false;
        spinRefreshBtn(false);
    }
}

function populateActivityLogDropdowns() {
    const docs = activityLogState.allDocs;
    const usernames = [...new Set(docs.map(function(d) { return d.Username; }).filter(Boolean))].sort();
    const usernameSelect = document.getElementById('alUsernameFilter');
    if (usernameSelect) {
        usernameSelect.innerHTML = '<option value="">All Users</option>';
        usernames.forEach(function(u) { const opt=document.createElement('option');opt.value=u;opt.textContent=u;usernameSelect.appendChild(opt); });
    }
}

function applyActivityLogFilters() {
    const state = activityLogState;
    const q = state.searchQuery.toLowerCase().trim();
    let results = [...state.allDocs].sort(function(a,b) {
        const tA=alToMs(a.TimeStamp),tB=alToMs(b.TimeStamp);
        return state.sortAsc ? tA-tB : tB-tA;
    });
    if (state.filterUsername) results = results.filter(function(d){ return (d.Username||'').toLowerCase()===state.filterUsername.toLowerCase(); });
    if (q) results = results.filter(function(d){ return (d.Description||'').toLowerCase().includes(q)||(d.Username||'').toLowerCase().includes(q)||(d.Location||'').toLowerCase().includes(q)||(d.ActivityID||'').toLowerCase().includes(q); });
    state.filtered = results;
    state.currentPage = 1;
    renderActivityLogPage();
    updateActivityLogStats();
    updateAlPills();
    updateAlFilterStyles();
}

function renderActivityLogPage() {
    const state = activityLogState;
    const {filtered, currentPage, perPage} = state;
    const totalPages = Math.max(1, Math.ceil(filtered.length/perPage));
    if (state.currentPage > totalPages) state.currentPage = totalPages;
    const start = (currentPage-1)*perPage;
    const pageItems = filtered.slice(start, start+perPage);
    if (filtered.length === 0) { showActivityLogState('empty'); return; }
    showActivityLogState('table');
    const tbody = document.getElementById('alTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    pageItems.forEach(function(doc,idx){ tbody.appendChild(buildAlRow(doc, start+idx+1)); });
    renderAlPagination(totalPages);
}

function buildAlRow(doc, rowNum) {
    const tr = document.createElement('tr');
    const {dateStr, timeStr} = alFormatTs(doc.TimeStamp);
    const username = doc.Username || '—';
    const role = doc.AccountRole || '';
    const desc = doc.Description || '—';
    const location = doc.Location || '—';
    const initials = username.substring(0,2).toUpperCase();
    const rowId = 'alrow-' + (doc.id||rowNum).toString().replace(/[^a-zA-Z0-9]/g,'_');
    tr.innerHTML =
        '<td class="al-td al-td-num">'+rowNum+'</td>'+
        '<td class="al-td al-td-time"><span class="al-time-date">'+alEsc(dateStr)+'</span><span class="al-time-clock">'+alEsc(timeStr)+'</span></td>'+
        '<td class="al-td al-td-user"><div class="al-username-wrap"><span class="al-avatar" style="'+alAvatarColor(username)+'">'+alEsc(initials)+'</span><span class="al-username-text">'+alEsc(username)+'</span></div></td>'+
        '<td class="al-td al-td-role"><span class="al-role-badge '+alRoleClass(role)+'">'+alEsc(alCapFirst(role)||'—')+'</span></td>'+
        '<td class="al-td al-td-desc"><div class="al-desc-text" id="desc-'+rowId+'">'+alEsc(desc)+'</div>'+(desc.length>100?'<button class="al-desc-toggle" onclick="toggleAlDesc(\'desc-'+rowId+'\',this)">Show more</button>':'')+'</td>'+
        '<td class="al-td al-td-loc"><span class="al-location-chip"><i class="fas fa-file-code" style="font-size:.7rem;"></i> '+alEsc(location)+'</span></td>';
    return tr;
}

function renderAlPagination(totalPages) {
    const current = activityLogState.currentPage;
    const pag = document.getElementById('alPagination');
    if (!pag) return;
    if (totalPages <= 1) { pag.style.display='none'; return; }
    pag.style.display = 'flex';
    const pageInfo = document.getElementById('alPageInfo');
    const pageNums = document.getElementById('alPageNumbers');
    const firstBtn = document.getElementById('alFirstBtn');
    const prevBtn  = document.getElementById('alPrevBtn');
    const nextBtn  = document.getElementById('alNextBtn');
    const lastBtn  = document.getElementById('alLastBtn');
    if (pageInfo) pageInfo.textContent = 'Page '+current+' of '+totalPages;
    if (firstBtn) firstBtn.disabled = current===1;
    if (prevBtn)  prevBtn.disabled  = current===1;
    if (nextBtn)  nextBtn.disabled  = current===totalPages;
    if (lastBtn)  lastBtn.disabled  = current===totalPages;
    if (pageNums) {
        pageNums.innerHTML = '';
        alBuildPageRange(current, totalPages).forEach(function(p){
            if (p==='...') { const s=document.createElement('span'); s.className='al-page-ellipsis'; s.textContent='…'; pageNums.appendChild(s); }
            else { const btn=document.createElement('button'); btn.className='al-page-num-btn'+(p===current?' al-page-active':''); btn.textContent=p; btn.onclick=function(){goToActivityLogPage(p);}; pageNums.appendChild(btn); }
        });
    }
}

function alBuildPageRange(current, total) {
    if (total<=7) return Array.from({length:total},function(_,i){return i+1;});
    const pages=[],left=Math.max(2,current-2),right=Math.min(total-1,current+2);
    pages.push(1); if(left>2)pages.push('...');
    for(let i=left;i<=right;i++)pages.push(i);
    if(right<total-1)pages.push('...');
    pages.push(total); return pages;
}

function updateActivityLogStats() {
    const filtered = activityLogState.filtered;
    const todayStr = new Date().toDateString();
    const todayCount = filtered.filter(function(d){ const ms=alToMs(d.TimeStamp); return ms&&new Date(ms).toDateString()===todayStr; }).length;
    const uniqueUsers = new Set(filtered.map(function(d){return d.Username;}).filter(Boolean)).size;
    const badge = document.getElementById('alTotalBadge');
    if (badge) badge.textContent = activityLogState.allDocs.length.toLocaleString()+' total';
    const ss = document.getElementById('alStatShowing');
    if (ss) ss.textContent = 'Showing '+filtered.length.toLocaleString()+' result'+(filtered.length!==1?'s':'');
    const st = document.getElementById('alStatToday');
    if (st) st.textContent = 'Today: '+todayCount.toLocaleString();
    const su = document.getElementById('alStatUniqueUsers');
    if (su) su.textContent = 'Users: '+uniqueUsers.toLocaleString();
}

function updateAlPills() {
    const state = activityLogState;
    const container = document.getElementById('alActiveFilters');
    if (!container) return;
    const pills = [];
    if (state.searchQuery) pills.push({label:'Search: "'+state.searchQuery+'"',clear:function(){state.searchQuery='';document.getElementById('alSearchInput').value='';alToggleClear();applyActivityLogFilters();}});
    if (state.filterUsername) pills.push({label:'User: '+state.filterUsername,clear:function(){state.filterUsername='';document.getElementById('alUsernameFilter').value='';applyActivityLogFilters();}});
    if (!pills.length) { container.style.display='none'; return; }
    container.style.display='flex'; container.innerHTML='';
    pills.forEach(function(pill){
        const span=document.createElement('span'); span.className='al-pill';
        span.innerHTML=alEsc(pill.label)+' <button class="al-pill-remove" title="Remove"><i class="fas fa-times"></i></button>';
        span.querySelector('button').addEventListener('click',pill.clear);
        container.appendChild(span);
    });
}

function updateAlFilterStyles() {
    const state = activityLogState;
    [['alUsernameFilter', state.filterUsername]].forEach(function(pair){
        const el = document.getElementById(pair[0]);
        if (!el) return;
        pair[1] ? el.classList.add('al-filter-active') : el.classList.remove('al-filter-active');
    });
}

function showActivityLogState(state, message) {
    ['alLoading','alError','alEmpty','alTableWrap'].forEach(function(id){ const el=document.getElementById(id); if(el)el.style.display='none'; });
    const statsRow = document.getElementById('alStatsRow');
    const pag = document.getElementById('alPagination');
    if (statsRow) statsRow.style.display=(state==='table'||state==='empty')?'flex':'none';
    if (pag) pag.style.display='none';
    const map={loading:'alLoading',error:'alError',empty:'alEmpty',table:'alTableWrap'};
    const target=document.getElementById(map[state]);
    if (target) target.style.display=(state==='table')?'block':'flex';
    if (state==='error'){const msg=document.getElementById('alErrorMsg');if(msg)msg.textContent=message||'Failed to load activity logs.';}
}

function onActivityLogFilter() {
    const state = activityLogState;
    state.searchQuery    = document.getElementById('alSearchInput')?.value    || '';
    state.filterUsername = document.getElementById('alUsernameFilter')?.value || '';
    alToggleClear();
    applyActivityLogFilters();
}

function clearActivityLogSearch() {
    const input = document.getElementById('alSearchInput');
    if (input) input.value = '';
    activityLogState.searchQuery = '';
    alToggleClear();
    applyActivityLogFilters();
}

function clearAllActivityLogFilters() {
    activityLogState.searchQuery = activityLogState.filterUsername = '';
    const input = document.getElementById('alSearchInput');
    if (input) input.value = '';
    ['alUsernameFilter'].forEach(function(id){ const el=document.getElementById(id); if(el)el.value=''; });
    alToggleClear();
    applyActivityLogFilters();
}

function alToggleClear() {
    const val = (document.getElementById('alSearchInput')?.value||'').trim();
    const btn = document.getElementById('alSearchClear');
    if (btn) btn.style.display = val.length > 0 ? '' : 'none';
}

function toggleActivityLogSort() {
    activityLogState.sortAsc = !activityLogState.sortAsc;
    const icon = document.getElementById('alSortIcon');
    if (icon) icon.innerHTML = activityLogState.sortAsc ? '<i class="fas fa-sort-up"></i>' : '<i class="fas fa-sort-down"></i>';
    applyActivityLogFilters();
}

function onActivityLogPerPageChange() {
    const sel = document.getElementById('alPerPage');
    if (sel) activityLogState.perPage = parseInt(sel.value,10)||10;
    activityLogState.currentPage = 1;
    renderActivityLogPage();
}

function goToActivityLogPage(page) {
    const total = Math.ceil(activityLogState.filtered.length/activityLogState.perPage);
    if (page===null) page=total;
    activityLogState.currentPage = Math.max(1, Math.min(page, total));
    renderActivityLogPage();
    document.getElementById('alTableWrap')?.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function prevActivityLogPage() { goToActivityLogPage(activityLogState.currentPage-1); }
function nextActivityLogPage() { goToActivityLogPage(activityLogState.currentPage+1); }

function toggleAlDesc(descId, btn) {
    const el = document.getElementById(descId);
    if (!el) return;
    const expanded = el.classList.toggle('al-expanded');
    btn.textContent = expanded ? 'Show less' : 'Show more';
}

function spinRefreshBtn(on) {
    const btn = document.getElementById('alRefreshBtn');
    if (!btn) return;
    btn.classList.toggle('al-spinning', on);
    btn.disabled = on;
}

// ── Activity Log utility functions ────────────────────────────────────────
function alToMs(ts) {
    if (!ts) return 0;
    if (typeof ts.toMillis==='function') return ts.toMillis();
    if (typeof ts.seconds==='number') return ts.seconds*1000;
    if (ts instanceof Date) return ts.getTime();
    if (typeof ts==='number') return ts;
    return 0;
}

function alFormatTs(ts) {
    const ms = alToMs(ts);
    if (!ms) return {dateStr:'Unknown date',timeStr:''};
    const d = new Date(ms);
    return {
        dateStr: d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}),
        timeStr: d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true})
    };
}

function alCapFirst(str) { if(!str)return''; return str.charAt(0).toUpperCase()+str.slice(1); }

function alRoleClass(role) {
    const r=(role||'').toLowerCase();
    if(r==='superadmin') return 'al-role-superadmin';
    if(r==='admin')      return 'al-role-admin';
    if(r==='teacher')    return 'al-role-teacher';
    if(r==='student')    return 'al-role-student';
    if(r==='school')     return 'al-role-school';
    return 'al-role-default';
}

function alAvatarColor(username) {
    const colors=['background:linear-gradient(135deg,#1e40af,#3b82f6)','background:linear-gradient(135deg,#0f766e,#14b8a6)','background:linear-gradient(135deg,#b45309,#f59e0b)','background:linear-gradient(135deg,#be185d,#ec4899)','background:linear-gradient(135deg,#064e3b,#34d399)','background:linear-gradient(135deg,#1e3a8a,#60a5fa)','background:linear-gradient(135deg,#78350f,#fbbf24)','background:linear-gradient(135deg,#7e22ce,#a855f7)'];
    let hash=0;
    for(let i=0;i<(username||'').length;i++){hash=(hash<<5)-hash+username.charCodeAt(i);hash|=0;}
    return colors[Math.abs(hash)%colors.length];
}

function alEsc(str) {
    if(!str)return'';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ── Keyboard / Click outside ──────────────────────────────────────────────
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const logoutModal = document.getElementById('logoutConfirmModal');
        if (logoutModal && logoutModal.style.display === 'flex') { closeLogoutModal(); return; }
        const activeModal = document.querySelector('.modal[style*="block"]');
        if (activeModal) { activeModal.style.display='none'; document.body.style.overflow='auto'; return; }
        ['addCourseModal','editCourseModal'].forEach(function(id){ const m=document.getElementById(id); if(m&&m.style.display==='flex'){m.style.display='none';document.body.style.overflow='auto';} });
    }
});

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    if (!event.target.closest('#userDropdown')) {
        const dc = document.getElementById('userDropdownContent');
        if (dc) dc.classList.remove('show');
    }
    if (!event.target.closest('#mobileUserDropdown')) {
        const mdc = document.getElementById('mobileUserDropdownContent');
        if (mdc) mdc.classList.remove('show');
    }
};

// ── DOMContentLoaded ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function() {
    checkSchoolSession();
    initYearWindowStart();
    updateUnifiedTableHeaders();

    await loadSchoolAccounts();
    await loadSystemSettings();

    // Load courses then set up the real-time listener for data display
    await loadCoursesFromFirestore();
    setupDataAnalyticsListener();

    updateUnifiedTable();
    updateSummary();

    logSchoolLogin();
});
