// About Modal Functions
        function openAboutModal() {
            const modal = document.getElementById('aboutModal');
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }

        // Contact Modal Functions
        function openContactModal() {
            const modal = document.getElementById('contactModal');
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }

        // Close Modal Function
        function closeModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
            document.body.style.overflow = 'auto';
        }

        // Contact Form Handler
        function handleContactSubmit(event) {
            event.preventDefault();
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const email = document.getElementById('contactEmail').value;
            const phone = document.getElementById('contactPhone').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;

            if (firstName && lastName && email && subject && message) {
                alert(`Thank you, ${firstName} ${lastName}! Your message has been sent successfully. We will get back to you soon.`);
                closeModal('contactModal');
                document.getElementById('firstName').value = '';
                document.getElementById('lastName').value = '';
                document.getElementById('contactEmail').value = '';
                document.getElementById('contactPhone').value = '';
                document.getElementById('subject').value = '';
                document.getElementById('message').value = '';
            }
        }

        // Close modal when clicking outside of it
        window.onclick = function(event) {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
            if (event.target.id === 'addCourseModal') {
                closeAddCourseModal();
            }
            if (event.target.id === 'addSchoolModal') {
                closeAddSchoolModal();
            }
            if (event.target.id === 'addAdminModal') {
                closeAddAdminModal();
            }
        }

        // Activity log data
        let activities = [
            {
                type: 'login',
                title: 'Admin Login',
                description: 'Super Admin logged into the system',
                time: '1 day ago'
            }
        ];

       let schoolsData = {
    all: {
        enrollees: {},
        outside: {},
        inside: {},
        graduates: {},
        passers: {}
    }
};


        let academicYears = ['2020-2021', '2021-2022', '2022-2023', '2023-2024', '2024-2025'];
        const YEAR_WINDOW_SIZE = 10;
        let yearWindowStart = 2020;
        let currentFilter = 'enrollees';
        let currentSchool = 'all';
        let currentEducationalLevel = 'all';

        // ── Read-optimization caches ──────────────────────────────────────────
        let _courseLoadCache = {};
        let _dataLoadCache = {};
        let _summaryLoadCache = {};

        // Navigation functionality
        function toggleMobileMenu() {
            const mobileMenu = document.getElementById('mobileMenu');
            const menuBtn = document.querySelector('.mobile-menu-btn');
            mobileMenu.classList.toggle('active');
            menuBtn.classList.toggle('active');
        }

        function closeMobileMenu() {
            const mobileMenu = document.getElementById('mobileMenu');
            const menuBtn = document.querySelector('.mobile-menu-btn');
            mobileMenu.classList.remove('active');
            menuBtn.classList.remove('active');
        }

        function showSection(sectionId) {
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });

            document.getElementById(sectionId).classList.add('active');

            document.querySelectorAll('.sidebar-menu a').forEach(link => {
                link.classList.remove('active');
            });
            event.target.classList.add('active');

            if (sectionId === 'activity-log') {
                if (!activityLogState.initialized && !activityLogState.isLoading) {
                    initActivityLog();
                }
            }
            if (sectionId === 'add-school') {
                slPopulateFilter();
                slFiltered = allSchoolDocs.slice();
                slFilterSchools();
            }
            if (sectionId === 'add-course') {
                clPopulateFilters();
                clLoadCoursesFromFirestore();
            }
            if (sectionId === 'settings') {
                loadSettingsIntoForm();
            }
        }

        function handleLogout() {
            openLogoutModal();
        }

        function openLogoutModal() {
            document.getElementById('logoutConfirmModal').style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }

        function closeLogoutModal() {
            document.getElementById('logoutConfirmModal').style.display = 'none';
            document.body.style.overflow = 'auto';
        }

        function confirmLogout() {
            closeLogoutModal();
            var _logoutUser = currentUser ? currentUser.username : 'SuperAdmin';
            currentUser = null;
            localStorage.removeItem('utownUser');
            saveActivityLog(_logoutUser + ' logged out.', 'superadmin.html').finally(function() {
                window.location.href = 'index.html';
            });
        }

        // Phone number formatting
        function formatPhoneNumber(input) {
            let digits = input.value.replace(/\D/g, '');

            if (!digits.startsWith('09')) {
                digits = '09' + digits.replace(/^0*9*/, '');
            }

            digits = digits.substring(0, 11);

            let formatted = '';
            if (digits.length <= 4) {
                formatted = digits;
            } else if (digits.length <= 7) {
                formatted = digits.substring(0, 4) + '-' + digits.substring(4);
            } else {
                formatted = digits.substring(0, 4) + '-' + digits.substring(4, 7) + '-' + digits.substring(7);
            }

            input.value = formatted;
        }

        function validatePhoneNumber(value) {
            const digits = value.replace(/\D/g, '');
            return digits.length === 11 && digits.startsWith('09');
        }

        function clearForm() {
            document.getElementById('addSchoolForm').reset();
        }

        function openAddSchoolModal() {
            document.getElementById('addSchoolModal').style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }

        function closeAddSchoolModal() {
            document.getElementById('addSchoolModal').style.display = 'none';
            document.body.style.overflow = 'auto';
            clearForm();
        }

        function openAddAdminModal() {
            document.getElementById('addAdminModal').style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }

        function closeAddAdminModal() {
            document.getElementById('addAdminModal').style.display = 'none';
            document.body.style.overflow = 'auto';
            clearAdminForm();
        }

        // School filtering functions
        async function filterBySchool() {
            const schoolFilter = document.getElementById('schoolFilter');
            currentSchool = schoolFilter.value;

            const sectionTitle = document.querySelector('#school-data .section-title');
            if (currentSchool === 'all') {
                sectionTitle.innerHTML = '<i class="fas fa-chart-bar"></i> School Data Analytics - All Schools';
            } else {
                const schoolName = schoolFilter.options[schoolFilter.selectedIndex].text;
                sectionTitle.innerHTML = `<i class="fas fa-chart-bar"></i> School Data Analytics - ${schoolName}`;
            }

            // Invalidate caches for new school selection
            var cacheKey = currentSchool + '_' + currentEducationalLevel;
            _courseLoadCache[cacheKey] = false;
            _dataLoadCache[cacheKey] = false;

            await loadCoursesFromFirestore();
            await loadDataFromFirestoreAndUpdate();

            activities.unshift({
                type: 'edit',
                title: 'Filter Applied',
                description: `Data filtered by school: ${schoolFilter.options[schoolFilter.selectedIndex].text}`,
                time: 'Just now'
            });
            updateActivityLog();
            var _by = currentUser ? currentUser.username : 'SuperAdmin';
            saveActivityLog(_by + ' filtered data by school: ' + schoolFilter.options[schoolFilter.selectedIndex].text + '.', 'superadmin.html');
        }

        async function filterByEducationalAttainment() {
            const educationalFilter = document.getElementById('educationalFilter');
            currentEducationalLevel = educationalFilter.value;

            const sectionTitle = document.querySelector('#school-data .section-title');
            const schoolFilter = document.getElementById('schoolFilter');
            const schoolName = currentSchool === 'all' ? 'All Schools' : schoolFilter.options[schoolFilter.selectedIndex].text;
            const educationalName = educationalFilter.options[educationalFilter.selectedIndex].text;

            sectionTitle.innerHTML = `<i class="fas fa-chart-bar"></i> School Data Analytics - ${schoolName} | ${educationalName}`;

            // Invalidate caches for new edu level
            var cacheKey = currentSchool + '_' + currentEducationalLevel;
            _courseLoadCache[cacheKey] = false;
            _dataLoadCache[cacheKey] = false;
            _summaryLoadCache[cacheKey] = false;

            await loadCoursesFromFirestore();
            await loadDataFromFirestoreAndUpdate();
            loadSummaryStatsFromFirestore();

            activities.unshift({
                type: 'edit',
                title: 'Educational Filter Applied',
                description: `Data filtered by educational attainment: ${educationalName}`,
                time: 'Just now'
            });
            updateActivityLog();
            var _by = currentUser ? currentUser.username : 'SuperAdmin';
            saveActivityLog(_by + ' filtered data by educational attainment: ' + educationalName + '.', 'superadmin.html');
        }

        async function loadSummaryStatsFromFirestore() {
            var statIds = ['totalEnrollees', 'totalOutside', 'totalInside', 'totalGraduates', 'totalPassers'];
            var summaryCards = document.querySelectorAll('.summary-card');

            function showStatLoading() {
                var spinner = '<span class=summary-stat-spinner></span>';
                statIds.forEach(function(id) {
                    var el = document.getElementById(id);
                    if (el) el.innerHTML = spinner;
                });
                summaryCards.forEach(function(card) { card.classList.add('stat-loading'); });
            }

            function clearStatLoading() {
                summaryCards.forEach(function(card) { card.classList.remove('stat-loading'); });
            }

            if (currentEducationalLevel === 'all') {
                statIds.forEach(function(id) {
                    var el = document.getElementById(id);
                    if (el) el.textContent = '0';
                });
                clearStatLoading();
                return;
            }

            var summaryCacheKey = currentSchool + '_' + currentEducationalLevel;
            if (_summaryLoadCache[summaryCacheKey]) {
                updateSummary();
                return;
            }

            var eduMap = {
                'bachelor': 'BACHELOR DEGREE',
                'twoyear': '2-YEAR COURSE',
                'tesda': 'TESDA',
                'graduate': 'GRADUATE COURSE'
            };
            var targetEdu = eduMap[currentEducationalLevel];
            if (!targetEdu) return;

            var categoryFirebaseMap = {
                'outside':   'OutsideBataan',
                'inside':    'InsideBataan',
                'graduates': 'Graduates',
                'passers':   'NumberofBoardPasser'
            };

            showStatLoading();

            try {
                var baseQuery = db.collection('Data_Analytics').where('EDUCATIONAL_ATTAINMENT', '==', targetEdu);
                if (currentSchool && currentSchool !== 'all') {
                    baseQuery = baseQuery.where('SchoolID', '==', currentSchool);
                }

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
                statIds.forEach(function(id) {
                    var el = document.getElementById(id);
                    if (el) el.textContent = 'Error';
                });
            } finally {
                clearStatLoading();
            }
        }

        function filterByCategory() {
            const categoryFilter = document.getElementById('categoryFilter');
            currentFilter = categoryFilter.value;

            loadDataFromFirestoreAndUpdate();

            activities.unshift({
                type: 'edit',
                title: 'Category Filter Applied',
                description: `Filtered by category: ${categoryFilter.options[categoryFilter.selectedIndex].text}`,
                time: 'Just now'
            });

            updateActivityLog();
            updateUnifiedTable();
            updateSummary();
        }

        // Year Management Functions
        function showYearManagement() {
            const yearSection = document.getElementById('yearManagementSection');
            const isVisible = yearSection.style.display !== 'none';

            if (isVisible) {
                yearSection.style.display = 'none';
                document.querySelector('.year-management').innerHTML = '<i class="fas fa-calendar-plus"></i> Manage Years';
            } else {
                yearSection.style.display = 'block';
                document.querySelector('.year-management').innerHTML = '<i class="fas fa-calendar-minus"></i> Hide Year Management';
                updateYearsList();
            }
        }

        function updateYearsList() {
            const yearsList = document.getElementById('yearsList');
            yearsList.innerHTML = '';

            academicYears.forEach((year, index) => {
                const yearItem = document.createElement('div');
                yearItem.className = 'year-item';
                yearItem.innerHTML = `
                    <span class="year-name">${year}</span>
                    <button class="delete-year-btn" onclick="deleteYear(${index})" title="Delete Year">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
                yearsList.appendChild(yearItem);
            });
        }

        function addNewYear() {
            const newYearInput = document.getElementById('newYearInput');
            const newYear = newYearInput.value.trim();

            if (!newYear) {
                alert('Please enter a year.');
                return;
            }

            if (academicYears.includes(newYear)) {
                alert('This year already exists.');
                return;
            }

            academicYears.push(newYear);

            Object.keys(schoolsData).forEach(school => {
                Object.keys(schoolsData[school]).forEach(category => {
                    Object.keys(schoolsData[school][category]).forEach(course => {
                        schoolsData[school][category][course].push({male:0,female:0});
                    });
                });
            });

            initYearWindowStart();
            renderYearNavigator();
            updateUnifiedTableHeaders();
            updateUnifiedTable();
            updateSummary();
            updateYearsList();

            newYearInput.value = '';

            activities.unshift({
                type: 'add',
                title: 'New Year Added',
                description: `Academic year ${newYear} was added to the system`,
                time: 'Just now'
            });
            updateActivityLog();

            alert(`Year ${newYear} added successfully!`);
        }

        function deleteYear(yearIndex) {
            if (academicYears.length <= 1) {
                alert('Cannot delete the last remaining year.');
                return;
            }

            const yearToDelete = academicYears[yearIndex];

            if (confirm(`Are you sure you want to delete the year ${yearToDelete}? This will remove all data for this year.`)) {
                academicYears.splice(yearIndex, 1);

                Object.keys(schoolsData).forEach(school => {
                    Object.keys(schoolsData[school]).forEach(category => {
                        Object.keys(schoolsData[school][category]).forEach(course => {
                            schoolsData[school][category][course].splice(yearIndex, 1);
                        });
                    });
                });

                initYearWindowStart();
                renderYearNavigator();
                updateUnifiedTableHeaders();
                updateUnifiedTable();
                updateSummary();
                updateYearsList();

                activities.unshift({
                    type: 'delete',
                    title: 'Year Deleted',
                    description: `Academic year ${yearToDelete} was removed from the system`,
                    time: 'Just now'
                });
                updateActivityLog();

                alert(`Year ${yearToDelete} deleted successfully!`);
            }
        }

        // ── Year Window Helpers (decade-based) ───────────────────────────────
        function getCurrentAcademicYear() {
            var now = new Date();
            var y = now.getFullYear();
            var m = now.getMonth();
            return m >= 7 ? (y + '-' + (y + 1)) : ((y - 1) + '-' + y);
        }

        function getVisibleYears() {
            var years = [];
            for (var i = 0; i < YEAR_WINDOW_SIZE; i++) {
                years.push((yearWindowStart + i) + '-' + (yearWindowStart + i + 1));
            }
            return years;
        }

        function initYearWindowStart() {
            var realYear = new Date().getFullYear();
            yearWindowStart = Math.floor(realYear / 10) * 10;
        }

        function yearNavPrev() {
            yearWindowStart -= YEAR_WINDOW_SIZE;
            renderYearNavigator();
            updateUnifiedTableHeaders();
            updateUnifiedTable();
        }

        function yearNavNext() {
            yearWindowStart += YEAR_WINDOW_SIZE;
            renderYearNavigator();
            updateUnifiedTableHeaders();
            updateUnifiedTable();
        }

        function renderYearNavigator() {
            // Year-chip circles removed by design
        }

        // Enhanced Unified Table Functions
        function updateUnifiedTableHeaders() {
            const mainHeaderRow = document.getElementById('mainHeaderRow');
            const subHeaderRow = document.getElementById('subHeaderRow');

            const existingHeaders = mainHeaderRow.querySelectorAll('th:not(:first-child)');
            existingHeaders.forEach(header => header.remove());

            const existingSubHeaders = subHeaderRow.querySelectorAll('th');
            existingSubHeaders.forEach(header => header.remove());

            const visibleYears = getVisibleYears();
            visibleYears.forEach((year) => {
                const yearHeader = document.createElement('th');
                yearHeader.className = 'year-header' + (year === getCurrentAcademicYear() ? ' year-header-current' : '');
                yearHeader.colSpan = 3;
                yearHeader.textContent = year;
                mainHeaderRow.appendChild(yearHeader);

                const femaleHeader = document.createElement('th');
                femaleHeader.className = 'gender-subheader female-header';
                femaleHeader.textContent = 'FEMALE';
                subHeaderRow.appendChild(femaleHeader);

                const maleHeader = document.createElement('th');
                maleHeader.className = 'gender-subheader male-header';
                maleHeader.textContent = 'MALE';
                subHeaderRow.appendChild(maleHeader);

                const totalHeader = document.createElement('th');
                totalHeader.className = 'gender-subheader total-header';
                totalHeader.textContent = 'TOTAL';
                subHeaderRow.appendChild(totalHeader);
            });
        }

  function updateUnifiedTable() {
    const tableBody = document.getElementById('unifiedTableBody');

    if (!schoolsData[currentSchool]) {
        schoolsData[currentSchool] = { enrollees:{}, outside:{}, inside:{}, graduates:{}, passers:{} };
    }
    if (!schoolsData[currentSchool][currentFilter]) {
        schoolsData[currentSchool][currentFilter] = {};
    }

    tableBody.innerHTML = '';
    const _tableFragment = document.createDocumentFragment();

    var coursesToShow;

    // Task 2 fix: require BOTH school AND edu to be specific before showing courses from courseList.
    // When either is 'all', show nothing (empty table) to avoid cross-school/cross-level mixing.
    if (currentSchool === 'all' || currentEducationalLevel === 'all') {
        coursesToShow = [];
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

        // Force-initialize all matching courses into schoolsData
        coursesToShow.forEach(function(name) {
            ['enrollees', 'outside', 'inside', 'graduates', 'passers'].forEach(function(cat) {
                if (!schoolsData[currentSchool][cat]) {
                    schoolsData[currentSchool][cat] = {};
                }
                if (!schoolsData[currentSchool][cat][name]) {
                    schoolsData[currentSchool][cat][name] = new Array(academicYears.length).fill(0).map(function() {
                        return { male: 0, female: 0 };
                    });
                }
            });
        });
    }

    // Get fresh data reference after initialization
    var data = schoolsData[currentSchool][currentFilter];

    coursesToShow.forEach(function(course) {
        var courseData = data[course];
        if (!courseData) return;

        var row = document.createElement('tr');
        row.className = 'course-row';

        var rowHTML = `
            <td>
                <input type="checkbox" class="course-checkbox" data-course="${course}">
                <span class="course-name">${course}</span>
            </td>
        `;

        var visibleYearsForTable = getVisibleYears();
        visibleYearsForTable.forEach(function(year) {
            var realYearIndex = academicYears.indexOf(year);
            var genderData = realYearIndex !== -1 ? courseData[realYearIndex] : null;
            var maleValue = (genderData && typeof genderData === 'object') ? (genderData.male || 0) : 0;
            var femaleValue = (genderData && typeof genderData === 'object') ? (genderData.female || 0) : 0;
            var totalValue = maleValue + femaleValue;

            rowHTML += `
                <td class="gender-data-cell female">
                    <input type="number" class="editable-input" value="${femaleValue}"
                           onchange="updateGenderData('${course}', ${realYearIndex}, 'female', this.value)" min="0">
                </td>
                <td class="gender-data-cell male">
                    <input type="number" class="editable-input" value="${maleValue}"
                           onchange="updateGenderData('${course}', ${realYearIndex}, 'male', this.value)" min="0">
                </td>
                <td class="gender-data-cell total">
                    ${totalValue}
                </td>
            `;
        });

        row.innerHTML = rowHTML;
        _tableFragment.appendChild(row);
    });

    tableBody.appendChild(_tableFragment);
}

        function updateGenderData(course, yearIndex, gender, value) {
            const newValue = parseInt(value) || 0;

            if (!schoolsData[currentSchool][currentFilter][course][yearIndex]) {
                schoolsData[currentSchool][currentFilter][course][yearIndex] = {male: 0, female: 0};
            }

            schoolsData[currentSchool][currentFilter][course][yearIndex][gender] = newValue;

            const row = event.target.closest('tr');
            const totalCells = row.querySelectorAll('.total');
            const yearCells = row.querySelectorAll('.gender-data-cell');

            const cellIndex = Array.from(row.cells).indexOf(event.target.closest('td'));
            const yearGroupIndex = Math.floor((cellIndex - 1) / 3);
            const totalCellIndex = yearGroupIndex * 3 + 3;

            if (row.cells[totalCellIndex]) {
                const maleVal = parseInt(row.cells[totalCellIndex - 2].querySelector('input').value) || 0;
                const femaleVal = parseInt(row.cells[totalCellIndex - 1].querySelector('input').value) || 0;
                row.cells[totalCellIndex].textContent = maleVal + femaleVal;
            }

            updateSummary();

            try {
                var _gUser = currentUser ? currentUser.username : 'SuperAdmin';
                var _gYear = academicYears[yearIndex] || ('Year index ' + yearIndex);
                saveActivityLog(_gUser + ' updated ' + course + ' | Year: ' + _gYear + ' | ' + gender + ': ' + newValue, 'superadmin.html');
            } catch(_ge) {}

            row.classList.add('highlight');
            setTimeout(() => {
                row.classList.remove('highlight');
            }, 1000);
        }

        function updateSummary() {
            if (currentEducationalLevel === 'all') {
                document.getElementById('totalEnrollees').textContent = '0';
                document.getElementById('totalOutside').textContent = '0';
                document.getElementById('totalInside').textContent = '0';
                document.getElementById('totalGraduates').textContent = '0';
                document.getElementById('totalPassers').textContent = '0';
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

        function addNewCourse() {
            const courseName = prompt('Enter course name:');
            if (courseName && courseName.trim()) {
                const trimmedName = courseName.trim();

                Object.keys(schoolsData[currentSchool]).forEach(category => {
                    schoolsData[currentSchool][category][trimmedName] = new Array(academicYears.length).fill(0).map(() => ({male:0, female:0}));
                });

                updateUnifiedTable();
                updateSummary();

                activities.unshift({
                    type: 'add',
                    title: 'New Course Added',
                    description: `Course "${trimmedName}" was added to ${currentSchool === 'all' ? 'the system' : 'the selected school'}`,
                    time: 'Just now'
                });
                updateActivityLog();

                setTimeout(() => {
                    const newRow = document.querySelector(`[data-course="${trimmedName}"]`).closest('tr');
                    if (newRow) {
                        newRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        newRow.classList.add('highlight');
                        setTimeout(() => newRow.classList.remove('highlight'), 2000);
                    }
                }, 100);
            }
        }

        function deleteSelectedCourses() {
            const checkboxes = document.querySelectorAll('.course-checkbox:checked');
            if (checkboxes.length === 0) {
                alert('Please select courses to delete.');
                return;
            }

            if (confirm(`Are you sure you want to delete ${checkboxes.length} course(s)?`)) {
                const deletedCourses = [];
                checkboxes.forEach(checkbox => {
                    const course = checkbox.dataset.course;
                    deletedCourses.push(course);
                    Object.keys(schoolsData[currentSchool]).forEach(category => {
                        delete schoolsData[currentSchool][category][course];
                    });
                });

                updateUnifiedTable();
                updateSummary();
                document.getElementById('selectAllCourses').checked = false;

                activities.unshift({
                    type: 'delete',
                    title: 'Courses Deleted',
                    description: `${deletedCourses.length} course(s) were removed: ${deletedCourses.join(', ')}`,
                    time: 'Just now'
                });
                updateActivityLog();
                var _by = currentUser ? currentUser.username : 'SuperAdmin';
                saveActivityLog(_by + ' deleted ' + deletedCourses.length + ' course(s): ' + deletedCourses.join(', ') + '.', 'superadmin.html');
            }
        }

        function toggleSelectAllCourses() {
            const selectAll = document.getElementById('selectAllCourses');
            const checkboxes = document.querySelectorAll('.course-checkbox');

            checkboxes.forEach(checkbox => {
                checkbox.checked = selectAll.checked;
            });
        }

        function searchTable() {
            const searchTerm = document.getElementById('tableSearch').value.toLowerCase();
            const rows = document.querySelectorAll('#unifiedTableBody tr');

            rows.forEach(row => {
                const courseName = row.querySelector('.course-name').textContent.toLowerCase();
                if (courseName.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        }

        // ── FEATURE 1: Export with full decade window (2020-2030) and merged headers ──
        function exportTableData() {
            var schoolSelect = document.getElementById('schoolFilter');
            var schoolLabel = schoolSelect.options[schoolSelect.selectedIndex].text;
            var eduSelect = document.getElementById('educationalFilter');
            var eduLabel = eduSelect.options[eduSelect.selectedIndex].text;
            var catSelect = document.getElementById('categoryFilter');
            var catLabel = catSelect.options[catSelect.selectedIndex].text;

            var exportYears = getVisibleYears();

            function colToLetter(n) {
                var s = '';
                while (n > 0) { n--; s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26); }
                return s;
            }

            var totalCols = 1 + exportYears.length * 3;
            var lastCol = colToLetter(totalCols);

            var colMaxLen = new Array(totalCols).fill(10);
            colMaxLen[0] = Math.max(colMaxLen[0], ('School: ' + schoolLabel).length + 2);

            var dataRows = [];
            document.querySelectorAll('#unifiedTableBody tr').forEach(function(row) {
                if (row.style.display === 'none') return;
                var dr = [];
                var cnEl = row.querySelector('.course-name');
                var cn = cnEl ? cnEl.textContent.trim() : '';
                dr.push(cn);
                colMaxLen[0] = Math.max(colMaxLen[0], cn.length + 2);

                exportYears.forEach(function(year, yi) {
                    var realYearIndex = academicYears.indexOf(year);
                    var courseName = cn;
                    var maleVal = 0, femaleVal = 0;
                    try {
                        var gd = (realYearIndex !== -1 && schoolsData[currentSchool] && schoolsData[currentSchool][currentFilter] && schoolsData[currentSchool][currentFilter][courseName])
                            ? schoolsData[currentSchool][currentFilter][courseName][realYearIndex]
                            : null;
                        maleVal = (gd && typeof gd === 'object') ? (gd.male || 0) : 0;
                        femaleVal = (gd && typeof gd === 'object') ? (gd.female || 0) : 0;
                    } catch(e) {}
                    var totalVal = maleVal + femaleVal;
                    dr.push(maleVal, femaleVal, totalVal);
                    var baseCI = 1 + yi * 3;
                    colMaxLen[baseCI]     = Math.max(colMaxLen[baseCI],     String(maleVal).length + 2);
                    colMaxLen[baseCI + 1] = Math.max(colMaxLen[baseCI + 1], String(femaleVal).length + 2);
                    colMaxLen[baseCI + 2] = Math.max(colMaxLen[baseCI + 2], String(totalVal).length + 2);
                });
                dataRows.push(dr);
            });

            if (typeof ExcelJS === 'undefined') {
                showToast('ExcelJS library not loaded. Cannot export.', 'error');
                return;
            }

            var workbook = new ExcelJS.Workbook();
            var ws = workbook.addWorksheet('School Data');

            var headerBg    = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
            var subheaderBg = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
            var evenRowBg   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FF' } };
            var oddRowBg    = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
            var thinBorderDark = { style: 'thin', color: { argb: 'FF1E3A8A' } };

            // Row 1: school info
            ws.addRow(['School: ' + schoolLabel]);
            ws.mergeCells(1, 1, 1, totalCols);
            // Row 2: edu + category info
            ws.addRow(['Educational Attainment: ' + eduLabel + '   |   Category: ' + catLabel]);
            ws.mergeCells(2, 1, 2, totalCols);
            // Row 3: year headers
            var yearHeaderRow = ['Course'];
            exportYears.forEach(function(y) { yearHeaderRow.push(y, '', ''); });
            ws.addRow(yearHeaderRow);
            // Row 4: gender subheaders
            var subHeaderRowData = [''];
            exportYears.forEach(function() { subHeaderRowData.push('FEMALE', 'MALE', 'TOTAL'); });
            ws.addRow(subHeaderRowData);
            // Merge year cells in row 3
            exportYears.forEach(function(y, yi) {
                var col = 2 + yi * 3;
                ws.mergeCells(3, col, 3, col + 2);
            });

            // Data rows
            dataRows.forEach(function(dr) { ws.addRow(dr); });

            // Styling
            ws.eachRow(function(row, rowNumber) {
                row.eachCell({ includeEmpty: true }, function(cell) {
                    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                    if (rowNumber === 1 || rowNumber === 2) {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
                        if (!cell.font) cell.font = {};
                        cell.font = Object.assign({}, cell.font, { color: { argb: 'FFFFFFFF' } });
                    } else if (rowNumber === 3) {
                        cell.fill = headerBg;
                        cell.border = { top: { style: 'medium', color: { argb: 'FF1E3A8A' } }, left: thinBorderDark, bottom: thinBorderDark, right: thinBorderDark };
                        if (!cell.font) cell.font = {};
                        cell.font = Object.assign({}, cell.font, { bold: true, color: { argb: 'FFFFFFFF' } });
                    } else if (rowNumber === 4) {
                        cell.fill = subheaderBg;
                        if (!cell.font) cell.font = {};
                        cell.font = Object.assign({}, cell.font, { bold: true, color: { argb: 'FFFFFFFF' } });
                    } else {
                        cell.fill = (rowNumber % 2 === 0) ? evenRowBg : oddRowBg;
                    }
                });
            });

            // Column widths
            for (var i = 0; i < totalCols; i++) {
                var w;
                if (i === 0) {
                    w = Math.max(colMaxLen[i], 30);
                } else {
                    w = Math.max(Math.ceil(colMaxLen[i] * 1.5), 20);
                }
                ws.getColumn(i + 1).width = w;
            }

            var now = new Date();
            var pad = function(n) { return n < 10 ? '0' + n : String(n); };
            var dateStr = now.getFullYear() + '' + pad(now.getMonth() + 1) + '' + pad(now.getDate());
            var timeStr = pad(now.getHours()) + '' + pad(now.getMinutes()) + '' + pad(now.getSeconds());
            var safeSchool = schoolLabel.replace(/[^a-zA-Z0-9]/g, '');
            var filename = 'UtownDataName_' + safeSchool + '_' + dateStr + '_' + timeStr + '.xlsx';

            workbook.xlsx.writeBuffer().then(function(buffer) {
                var blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                var a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(a.href);
                var _by = currentUser ? currentUser.username : 'SuperAdmin';
                saveActivityLog(_by + ' exported table data to Excel.', 'superadmin.html');
            });
        }

        function refreshTableData() {
            var cacheKey = currentSchool + '_' + currentEducationalLevel;
            _dataLoadCache[cacheKey] = false;
            _summaryLoadCache[cacheKey] = false;
            loadDataFromFirestoreAndUpdate();
            loadSummaryStatsFromFirestore();

            activities.unshift({
                type: 'edit',
                title: 'Data Refreshed',
                description: 'Table data has been refreshed',
                time: 'Just now'
            });
            updateActivityLog();
            var _by = currentUser ? currentUser.username : 'SuperAdmin';
            saveActivityLog(_by + ' refreshed the data table.', 'superadmin.html');
        }

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

            saveAllDataToFirebase().then(() => {
                saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
                showToast('All data saved successfully!', 'success');

                var _savedCourses = [];
                try {
                    var _data = schoolsData[currentSchool] && schoolsData[currentSchool][currentFilter] ? schoolsData[currentSchool][currentFilter] : {};
                    var _visYears = typeof getVisibleYears === 'function' ? getVisibleYears() : (academicYears || []);
                    Object.keys(_data).forEach(function(course) {
                        (_visYears.length ? _visYears : []).forEach(function(year) {
                            var _yi = (academicYears || []).indexOf(year);
                            if (_yi === -1) return;
                            var _gd = _data[course][_yi];
                            if (_gd && (_gd.male > 0 || _gd.female > 0)) {
                                _savedCourses.push(course + ' [' + year + ': M=' + (_gd.male||0) + ' F=' + (_gd.female||0) + ']');
                            }
                        });
                    });
                } catch(_e) {}
                var _saveDesc = _savedCourses.length > 0
                    ? 'Saved: ' + _savedCourses.slice(0,3).join('; ') + (_savedCourses.length > 3 ? ' ...+' + (_savedCourses.length - 3) + ' more' : '')
                    : 'All school data changes have been saved successfully';
                activities.unshift({
                    type: 'edit',
                    title: 'Data Saved',
                    description: _saveDesc,
                    time: 'Just now'
                });
                updateActivityLog();
                var _saveUser = currentUser ? currentUser.username : 'SuperAdmin';
                saveActivityLog(_saveUser + ' saved data: ' + _saveDesc, 'superadmin.html');

                setTimeout(() => {
                    saveBtn.innerHTML = originalText;
                    saveBtn.disabled = false;
                }, 2000);
            }).catch((error) => {
                console.error('Error saving data:', error);
                saveBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error!';
                showToast('Error saving data to database', 'error');

                setTimeout(() => {
                    saveBtn.innerHTML = originalText;
                    saveBtn.disabled = false;
                }, 2000);
            });
        }

        // Function to save all current table data to Firebase
async function saveAllDataToFirebase() {
    try {
        if (currentFilter === 'enrollees' && document.getElementById('categoryFilter').value === 'enrollees') {
            throw new Error('Please choose a category before saving.');
        }

        const data = schoolsData[currentSchool][currentFilter];
        const savePromises = [];

        const categoryMap = {
            'enrollees': 'N/A',
            'outside': 'OutsideBataan',
            'inside': 'InsideBataan',
            'graduates': 'Graduates',
            'passers': 'NumberofBoardPasser',
        };

        const categorySelect = document.getElementById('categoryFilter');
        const selectedCategory = categorySelect ? categorySelect.value : currentFilter;
        const category = categoryMap[selectedCategory] || 'N/A';

        const eduMap = {
            'bachelor': 'BACHELOR DEGREE',
            'twoyear': '2-YEAR COURSE',
            'tesda': 'TESDA',
            'graduate': 'GRADUATE COURSE'
        };
        let selectedEduValue = document.getElementById('educationalFilter')?.value || '';
        let educationalAttainment = 'N/A';
        if (selectedEduValue && selectedEduValue !== 'all') {
            educationalAttainment = eduMap[selectedEduValue] || 'N/A';
        }
        Object.keys(data).forEach(courseName => {
            data[courseName].forEach((genderData, yearIndex) => {
                const year = academicYears[yearIndex];
                if (!year) return;

                const maleValue = (genderData && typeof genderData === 'object') ? (genderData.male || 0) : 0;
                const femaleValue = (genderData && typeof genderData === 'object') ? (genderData.female || 0) : 0;

                if (maleValue > 0 || femaleValue > 0) {
                    const promise = saveToDataAnalytics(
                        currentSchool === 'all' ? 'ALL' : currentSchool,
                        year,
                        courseName,
                        category,
                        maleValue,
                        femaleValue,
                        educationalAttainment
                    );
                    savePromises.push(promise);
                }
            });
        });
        await Promise.all(savePromises);
        console.log(`Saved ${savePromises.length} records to Firebase`);

    } catch (error) {
        console.error('Error in saveAllDataToFirebase:', error);
        throw error;
    }
}

        function updateActivityLog() {
            const activityLog = document.getElementById('activityLog');
            if (!activityLog) return;

            activities.forEach(activity => {
                const activityItem = document.createElement('div');
                activityItem.className = 'activity-item';

                activityItem.innerHTML = `
                    <div class="activity-icon ${activity.type}">
                        <i class="fas fa-${activity.type === 'add' ? 'plus' : activity.type === 'edit' ? 'edit' : activity.type === 'delete' ? 'trash' : 'sign-in-alt'}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-description">${activity.description}</div>
                    </div>
                    <div class="activity-time">${activity.time}</div>
                `;

                activityLog.appendChild(activityItem);
            });
        }

        // Global variable for session management
        let currentUser = null;

        function checkExistingSession() {
            const storedUser = localStorage.getItem('utownUser');
            if (storedUser) {
                try {
                    currentUser = JSON.parse(storedUser);
                    updateUIForLoggedInUser(currentUser);
                } catch (error) {
                    console.error('Error parsing stored user data:', error);
                    localStorage.removeItem('utownUser');
                    window.location.href = 'index.html';
                    return;
                }
            } else {
                window.location.href = 'index.html';
                return;
            }
        }

        // ─── Firestore ActivityLog writer (timestamp-based ID, no collection scan) ──
        function generateActivityLogId() {
            return 'ActivityID_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        }

        async function saveActivityLog(description, location) {
            try {
                const actId = generateActivityLogId();
                const user = currentUser || {};
                await db.collection('ActivityLog').doc(actId).set({
                    ActivityID: actId,
                    AccountRole: user.role || 'superadmin',
                    Username: user.username || 'SuperAdmin',
                    UserID: user.admin_id || user.user_id || user.username || 'SuperAdmin',
                    Description: description,
                    Location: location || 'superadmin.html',
                    TimeStamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch(e) { console.error('saveActivityLog error:', e); }
        }

        function updateUIForLoggedInUser(user) {
            const signInButtons = document.querySelectorAll('#signInButton, #mobileSignInButton');
            signInButtons.forEach(btn => btn.classList.add('hidden'));

            const userDropdowns = document.querySelectorAll('#userDropdown, #mobileUserDropdown');
            userDropdowns.forEach(dropdown => dropdown.classList.remove('hidden'));

            const dropdownTexts = document.querySelectorAll('#userDropdownText, #mobileUserDropdownText');
            dropdownTexts.forEach(text => {
                text.textContent = 'Hello, ' + user.username;
            });
        }

        function updateUIForLoggedOutUser() {
            const signInButtons = document.querySelectorAll('#signInButton, #mobileSignInButton');
            signInButtons.forEach(btn => btn.classList.remove('hidden'));

            const userDropdowns = document.querySelectorAll('#userDropdown, #mobileUserDropdown');
            userDropdowns.forEach(dropdown => dropdown.classList.add('hidden'));

            const dropdownContents = document.querySelectorAll('#userDropdownContent, #mobileUserDropdownContent');
            dropdownContents.forEach(content => content.classList.remove('show'));
        }

        function toggleUserDropdown() {
            const dropdownContent = document.getElementById('userDropdownContent');
            dropdownContent.classList.toggle('show');
        }

        function toggleMobileUserDropdown() {
            const dropdownContent = document.getElementById('mobileUserDropdownContent');
            dropdownContent.classList.toggle('show');
        }

        function handleSignIn() {
            alert('Sign In feature coming soon.');
        }

        function handleDashboard() {
            document.getElementById('userDropdownContent').classList.remove('show');
            if (document.getElementById('mobileUserDropdownContent')) {
                document.getElementById('mobileUserDropdownContent').classList.remove('show');
            }
        }

        function handleSignOut() {
            openLogoutModal();
        }

        function doSignOut() {
            currentUser = null;
            localStorage.removeItem('utownUser');
            updateUIForLoggedOutUser();
        }

        // ── Firebase Init ──────────────────────────────────────────────────────
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

        // ── FEATURE 2 & 3 & 4: Settings (Firebase Settings collection) ────────

        async function loadSettingsFromFirebase() {
            try {
                var settingKeys = ['SystemName', 'AdminEmail', 'BackupFrequency', 'MaintenanceMode'];
                var results = {};
                await Promise.all(settingKeys.map(async function(key) {
                    var doc = await db.collection('Settings').doc(key).get();
                    if (doc.exists) {
                        var d = doc.data();
                        results[key] = d.value !== undefined ? d.value : (Object.values(d)[0] || '');
                    }
                }));
                return results;
            } catch(e) {
                console.error('loadSettingsFromFirebase error:', e);
                return {};
            }
        }

        async function applySettingsToUI(settings) {
            if (settings.SystemName) {
                var navEl = document.getElementById('navSiteName');
                if (navEl) navEl.textContent = settings.SystemName;
                document.title = 'Super Admin Dashboard - ' + settings.SystemName;
            }
            if (settings.AdminEmail) {
                var emailEl = document.getElementById('contactAdminEmail');
                if (emailEl) emailEl.textContent = settings.AdminEmail;
            }
        }

        async function loadSettingsIntoForm() {
            var settings = await loadSettingsFromFirebase();
            if (settings.SystemName !== undefined) {
                var el = document.getElementById('settingsSystemName');
                if (el) el.value = settings.SystemName;
            }
            if (settings.AdminEmail !== undefined) {
                var el = document.getElementById('settingsAdminEmail');
                if (el) el.value = settings.AdminEmail;
            }
            if (settings.BackupFrequency !== undefined) {
                var el = document.getElementById('settingsBackupFreq');
                if (el) el.value = settings.BackupFrequency;
            }
            if (settings.MaintenanceMode !== undefined) {
                var el = document.getElementById('settingsMaintenanceMode');
                if (el) el.value = settings.MaintenanceMode;
            }
        }

        var _settingsSaving = false;

        async function saveSettings() {
            if (_settingsSaving) return;

            var systemName = document.getElementById('settingsSystemName').value.trim();
            var adminEmail = document.getElementById('settingsAdminEmail').value.trim();
            var backupFreq = document.getElementById('settingsBackupFreq').value;
            var maintMode  = document.getElementById('settingsMaintenanceMode').value;

            if (!systemName) { showToast('System Name cannot be empty.', 'error'); return; }
            if (!adminEmail)  { showToast('Admin Email cannot be empty.', 'error'); return; }

            var saveBtn = document.querySelector('#settings .btn-primary');
            var originalHTML = saveBtn ? saveBtn.innerHTML : '';
            _settingsSaving = true;
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            }

            try {
                await db.collection('Settings').doc('SystemName').set({ value: systemName });
                await db.collection('Settings').doc('AdminEmail').set({ value: adminEmail });
                await db.collection('Settings').doc('BackupFrequency').set({ value: backupFreq });
                await db.collection('Settings').doc('MaintenanceMode').set({ value: maintMode });

                showToast('Settings saved successfully!', 'success');
                if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';

                await applySettingsToUI({ SystemName: systemName, AdminEmail: adminEmail });

                activities.unshift({
                    type: 'edit',
                    title: 'Settings Saved',
                    description: 'System settings were updated.',
                    time: 'Just now'
                });
                updateActivityLog();
                var _by = currentUser ? currentUser.username : 'SuperAdmin';
                saveActivityLog(_by + ' updated system settings.', 'superadmin.html');

                if (backupFreq === 'daily') {
                    checkAndRunDailyBackup();
                } else if (backupFreq === 'weekly') {
                    checkAndRunWeeklyBackup();
                } else if (backupFreq === 'monthly') {
                    checkAndRunMonthlyBackup();
                }

                setTimeout(function() {
                    if (saveBtn) { saveBtn.innerHTML = originalHTML; saveBtn.disabled = false; }
                    _settingsSaving = false;
                }, 2000);
            } catch(e) {
                console.error('saveSettings error:', e);
                showToast('Error saving settings: ' + e.message, 'error');
                if (saveBtn) { saveBtn.innerHTML = originalHTML; saveBtn.disabled = false; }
                _settingsSaving = false;
            }
        }

        // ── FEATURE 5: Daily Firebase Backup ──────────────────────────────────

        async function checkAndRunDailyBackup() {
            var today = new Date().toISOString().slice(0, 10);
            var lastBackupDate = localStorage.getItem('utownLastBackupDate');
            if (lastBackupDate === today) return;
            await runFirebaseBackup();
            localStorage.setItem('utownLastBackupDate', today);
        }

        async function checkAndRunWeeklyBackup() {
            var now = new Date();
            var startOfYear = new Date(now.getFullYear(), 0, 1);
            var weekNum = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
            var weekKey = now.getFullYear() + '-W' + String(weekNum).padStart(2, '0');
            var lastWeek = localStorage.getItem('utownLastBackupWeek');
            if (lastWeek === weekKey) return;
            await runFirebaseBackup();
            localStorage.setItem('utownLastBackupWeek', weekKey);
        }

        async function checkAndRunMonthlyBackup() {
            var now = new Date();
            var monthKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '00');
            var lastMonth = localStorage.getItem('utownLastBackupMonth');
            if (lastMonth === monthKey) return;
            await runFirebaseBackup();
            localStorage.setItem('utownLastBackupMonth', monthKey);
        }

        function sanitizeFirestoreData(val) {
            if (val === null || val === undefined) return val;
            if (typeof val === 'object' && typeof val.toDate === 'function') {
                return val.toDate().toISOString();
            }
            if (typeof val === 'object' && typeof val.seconds === 'number' && typeof val.nanoseconds === 'number') {
                return new Date(val.seconds * 1000).toISOString();
            }
            if (Array.isArray(val)) {
                return val.map(sanitizeFirestoreData);
            }
            if (typeof val === 'object') {
                var out = {};
                for (var k in val) {
                    if (Object.prototype.hasOwnProperty.call(val, k)) {
                        out[k] = sanitizeFirestoreData(val[k]);
                    }
                }
                return out;
            }
            return val;
        }

        async function runFirebaseBackup() {
            try {
                showToast('Preparing backup — fetching all collections...', 'success');
                var backupData = {};

                var collections = ['ListofSchool', 'SuperAdminAccount', 'Data_Analytics', 'COURSE', 'ActivityLog', 'Settings'];
                var fetchedCount = 0;

                for (var ci = 0; ci < collections.length; ci++) {
                    var colName = collections[ci];
                    try {
                        var snap = await db.collection(colName).get();
                        backupData[colName] = {};
                        snap.forEach(function(doc) {
                            backupData[colName][doc.id] = sanitizeFirestoreData(doc.data());
                        });
                        fetchedCount += snap.size;
                        console.log('Backup: fetched ' + snap.size + ' docs from ' + colName);
                    } catch(e) {
                        console.warn('Backup: could not fetch collection ' + colName, e);
                        backupData[colName] = { _error: e.message || 'permission denied' };
                    }
                }

                var now = new Date();
                var pad = function(n) { return n < 10 ? '0' + n : String(n); };
                var dateStr = now.getFullYear() + '' + pad(now.getMonth() + 1) + '' + pad(now.getDate());
                var filename = 'firebase_backup_' + dateStr + '.json';

                var jsonStr = JSON.stringify(backupData, null, 2);

                var blob = new Blob([jsonStr], { type: 'application/json' });
                var a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(a.href);

                showToast('Backup complete! ' + fetchedCount + ' records saved to ' + filename, 'success');
                console.log('Daily backup complete:', filename, '—', fetchedCount, 'total records');
            } catch(e) {
                console.error('runFirebaseBackup error:', e);
                showToast('Backup failed: ' + e.message, 'error');
            }
        }

        // ── Data Analytics Firestore Integration ─────────────────────────────
        // friendlyIdCounter removed — saveToDataAnalytics uses set()+merge to avoid reads.

        // Convert school name to abbreviation for document ID
        function getSchoolAbbreviation(schoolId) {
            const school = allSchoolDocs.find(s => s.docId === schoolId);
            return school ? school.schoolabbrev : 'UNKNOWN';
        }

        // Convert course name to abbreviation
        function getCourseAbbreviation(courseName) {
            const words = courseName.split(' ');
            if (words.length === 1) {
                return courseName.substring(0, 4).toUpperCase();
            }
            return words.map(word => word.charAt(0).toUpperCase()).join('').substring(0, 6);
        }

        // Save data to Firestore Data_Analytics using set()+merge (no pre-read needed)
        async function saveToDataAnalytics(schoolId, year, courseName, category, maleCount, femaleCount, educationalAttainment) {
            try {
                const schoolAbbrev = getSchoolAbbreviation(schoolId);
                const courseAbbrev = getCourseAbbreviation(courseName);
                const docId = `${schoolAbbrev}_${year}_${courseAbbrev}_${category}`;

                const dataToSave = {
                    CATEGORY: category,
                    COURSE: courseName,
                    EDUCATIONAL_ATTAINMENT: educationalAttainment,
                    YEAR: year,
                    MALE: parseInt(maleCount) || 0,
                    FEMALE: parseInt(femaleCount) || 0,
                    TIMESTAMP: firebase.firestore.FieldValue.serverTimestamp(),
                    SchoolID: schoolId
                };

                await db.collection('Data_Analytics').doc(docId).set(dataToSave, { merge: true });

                console.log('Data saved to Firestore:', docId);
                return true;
            } catch (error) {
                console.error('Error saving to Data_Analytics:', error);
                showToast('Error saving data to database', 'error');
                return false;
            }
        }

        // Save individual gender data changes to Firebase
async function saveGenderDataToFirebase(courseName, yearIndex, gender, value) {
    try {
        if (currentSchool === 'all' || !currentSchool) return;
        const year = academicYears[yearIndex];
        if (!year) return;

        const eduMap = {
            'bachelor': 'BACHELOR DEGREE',
            'twoyear': '2-YEAR COURSE',
            'tesda': 'TESDA',
            'graduate': 'GRADUATE COURSE'
        };
        let selectedEduValue = document.getElementById('educationalFilter')?.value || '';
        const educationalAttainment = (selectedEduValue && selectedEduValue !== 'all')
            ? (eduMap[selectedEduValue] || 'N/A')
            : 'N/A';

        const currentData = schoolsData[currentSchool][currentFilter][courseName][yearIndex];
        const maleCount = currentData ? currentData.male : 0;
        const femaleCount = currentData ? currentData.female : 0;

        const categoryMap = {
            'enrollees': 'N/A',
            'outside': 'OutsideBataan',
            'inside': 'InsideBataan',
            'graduates': 'Graduates',
            'passers': 'NumberofBoardPasser'
        };

        const categorySelect = document.getElementById('categoryFilter');
        const selectedCategory = categorySelect ? categorySelect.value : currentFilter;
        const firebaseCategory = categoryMap[selectedCategory] || 'N/A';

        await saveToDataAnalytics(
            currentSchool,
            year,
            courseName,
            firebaseCategory,
            maleCount,
            femaleCount,
            educationalAttainment
        );

        console.log('Gender data saved to Firebase:', {
            course: courseName,
            year: year,
            category: firebaseCategory,
            male: maleCount,
            female: femaleCount,
            eduAtt: educationalAttainment
        });

    } catch (error) {
        console.error('Error saving gender data to Firebase:', error);
        showToast('Error saving data to database', 'error');
    }
}

        // Load data from Firestore Data_Analytics (one-time .get())
        async function loadDataFromFirestore(schoolId, educationalAttainment, category) {
            try {
                let query = db.collection('Data_Analytics');

                if (schoolId && schoolId !== 'all') {
                    query = query.where('SchoolID', '==', schoolId);
                }
                if (educationalAttainment && educationalAttainment !== 'all') {
                    const eduMap = {
                        'bachelor': 'BACHELOR DEGREE',
                        'twoyear': '2-YEAR COURSE',
                        'tesda': 'TESDA',
                        'graduate': 'GRADUATE COURSE'
                    };
                    const targetEdu = eduMap[educationalAttainment];
                    if (targetEdu) {
                        query = query.where('EDUCATIONAL_ATTAINMENT', '==', targetEdu);
                    }
                }
                if (category && category !== 'all') {
                    const categoryMap = {
                        'enrollees': 'N/A',
                        'outside': 'OutsideBataan',
                        'inside': 'InsideBataan',
                        'graduates': 'Graduates',
                        'passers': 'NumberofBoardPasser'
                    };
                    const targetCategory = categoryMap[category];
                    if (targetCategory) {
                        query = query.where('CATEGORY', '==', targetCategory);
                    }
                }

                const snapshot = await query.get();
                const loadedData = {};

                snapshot.forEach(doc => {
                    const data = doc.data();
                    const courseName = data.COURSE;
                    const year = data.YEAR;
                    const male = data.MALE || 0;
                    const female = data.FEMALE || 0;

                    if (!loadedData[courseName]) {
                        loadedData[courseName] = {};
                    }
                    if (!loadedData[courseName][year]) {
                        loadedData[courseName][year] = { male: 0, female: 0 };
                    }

                    loadedData[courseName][year] = { male, female };
                });

                return loadedData;
            } catch (error) {
                console.error('Error loading data from Firestore:', error);
                return {};
            }
        }

        // ── Toast ─────────────────────────────────────────────────────────────
        function showToast(message, type) {
            type = type || 'success';
            var container = document.getElementById('toastContainer');
            if (!container) return;
            var toast = document.createElement('div');
            var icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-exclamation-circle';
            toast.className = 'toast toast-' + type;
            toast.innerHTML = '<i class="fas ' + icon + '"></i> ' + message;
            container.appendChild(toast);
            setTimeout(function() { toast.classList.add('show'); }, 10);
            setTimeout(function() { toast.classList.remove('show'); setTimeout(function() { toast.remove(); }, 300); }, 3500);
        }

        // ── Admin Accounts (Firestore) ────────────────────────────────────────
        var adminPage = 1;
        var adminPageSize = 5;
        var adminSearchQuery = '';
        var allAdminDocs = [];
        var adminFilteredDocs = [];

        async function getNextAdminId(lname) {
            var snap = await db.collection('SuperAdminAccount').get();
            var max = 0;
            snap.forEach(function(doc) {
                var m = doc.id.match(/^UtownId_(\d+)_/);
                if (m) max = Math.max(max, parseInt(m[1]));
            });
            var safeLname = lname.replace(/[^a-zA-Z0-9]/g, '');
            return 'UtownId_' + String(max + 1).padStart(4, '0') + '_' + safeLname;
        }

        async function addAdminAccount(event) {
            event.preventDefault();
            var fname    = document.getElementById('adminFirstName').value.trim();
            var lname    = document.getElementById('adminLastName').value.trim();
            var bday     = document.getElementById('adminBirthday').value;
            var address  = document.getElementById('adminAddress').value.trim();
            var username = document.getElementById('adminUsername').value.trim();
            var password = document.getElementById('adminPassword').value;
            var _addAdminBtn = document.getElementById('addAdminSubmitBtn');
            var _addAdminBtnOrig = _addAdminBtn ? _addAdminBtn.innerHTML : '';
            function _restoreAdminBtn() { if (_addAdminBtn) { _addAdminBtn.disabled = false; _addAdminBtn.innerHTML = _addAdminBtnOrig; } }
            if (_addAdminBtn) { _addAdminBtn.disabled = true; _addAdminBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...'; }
            try {
                        var snap = await db.collection('SuperAdminAccount').where('deletestats', '==', 0).get();
            for (var i = 0; i < snap.docs.length; i++) {
                var d = snap.docs[i].data();
                if (d.fname.toLowerCase() === fname.toLowerCase() && d.lname.toLowerCase() === lname.toLowerCase()) { showToast('Account Already Exist', 'error'); _restoreAdminBtn(); return; }
                if (d.username.toLowerCase() === username.toLowerCase()) { showToast('Username Already Exist', 'error'); try { _restoreAdminBtn(); } catch(_e) {} return; }
            }
            var admin_id = await getNextAdminId(lname);
            await db.collection('SuperAdminAccount').doc(admin_id).set({
                fname: fname, lname: lname, bday: bday, address: address, username: username, password: password,
                admin_id: admin_id,
                AddedBy: currentUser ? currentUser.username : 'SuperAdmin',
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                deletestats: 0
            });
            showToast(fname + ' ' + lname + ' added as admin.', 'success');
            clearAdminForm();
            closeAddAdminModal();
            await loadAdminAccounts();
            activities.unshift({ type: 'add', title: 'New Admin Account Added', description: username + ' was added as an admin account', time: 'Just now' });
            updateActivityLog();
            var _adminAddedBy = currentUser ? currentUser.username : 'SuperAdmin';
            saveActivityLog(_adminAddedBy + ' added admin account "' + username + '".', 'superadmin.html');
            } catch (_addAdminErr) {
                console.error('addAdminAccount error:', _addAdminErr);
                showToast('Error adding admin: ' + (_addAdminErr.message || 'Unknown error'), 'error');
            } finally {
                _restoreAdminBtn();
            }
        }

        function clearAdminForm() {
            document.getElementById('addAdminForm').reset();
        }

        // ── Custom delete confirm modal ──────────────────────────────────────
        var _pendingDeleteFn = null;

        function showDeleteConfirm(title, message, onConfirm) {
            document.getElementById('dcmTitle').textContent = title;
            document.getElementById('dcmMsg').textContent = message;
            _pendingDeleteFn = onConfirm;
            document.getElementById('deleteConfirmModal').classList.add('open');
        }

        function closeDeleteConfirm() {
            document.getElementById('deleteConfirmModal').classList.remove('open');
            _pendingDeleteFn = null;
        }

        function confirmDeleteAction() {
            document.getElementById('deleteConfirmModal').classList.remove('open');
            if (typeof _pendingDeleteFn === 'function') _pendingDeleteFn();
            _pendingDeleteFn = null;
        }

        function confirmDeleteAdmin(docId, name) {
            showDeleteConfirm(
                'Delete Admin Account',
                'Are you sure you want to delete "' + name + '"? This action cannot be undone.',
                function() { deleteAdminAccount(docId); }
            );
        }

        function confirmDeleteSchool(docId, name) {
            showDeleteConfirm(
                'Delete School Account',
                'Are you sure you want to delete "' + name + '"? This action cannot be undone.',
                function() { deleteSchoolAccount(docId); }
            );
        }

        // ── Toggle password visibility ───────────────────────────────────────
        function togglePasswordDisplay(elId, plainText) {
            var el = document.getElementById(elId);
            if (!el) return;
            var showing = el.getAttribute('data-show') === '1';
            if (showing) {
                el.textContent = '••••••••';
                el.setAttribute('data-show', '0');
            } else {
                el.textContent = plainText;
                el.setAttribute('data-show', '1');
            }
        }

        function togglePasswordById(elId) {
            var el = document.getElementById(elId);
            if (!el) return;
            var showing = el.getAttribute('data-show') === '1';
            if (showing) {
                el.textContent = '••••••••';
                el.setAttribute('data-show', '0');
            } else {
                var pw = el.getAttribute('data-pw') || '';
                el.textContent = pw;
                el.setAttribute('data-show', '1');
            }
        }

        async function loadAdminAccounts() {
            try {
                var snap = await db.collection('SuperAdminAccount').where('deletestats', '==', 0).get();
                allAdminDocs = [];
                snap.forEach(function(doc) {
                    var data = doc.data();
                    data.docId = doc.id;
                    allAdminDocs.push(data);
                });
                allAdminDocs.sort(function(a, b) {
                    return (b.timestamp && a.timestamp) ? b.timestamp.seconds - a.timestamp.seconds : 0;
                });
                adminPage = 1;
                filterAdminAccounts();
                updateCourseSchoolDropdowns();
            } catch(e) {
                console.error('loadAdminAccounts error:', e);
            }
        }

        function filterAdminAccounts() {
            adminSearchQuery = (document.getElementById('adminSearch') ? document.getElementById('adminSearch').value : '').toLowerCase();
            adminFilteredDocs = allAdminDocs.filter(function(d) {
                return !adminSearchQuery ||
                    (d.fname && d.fname.toLowerCase().includes(adminSearchQuery)) ||
                    (d.lname && d.lname.toLowerCase().includes(adminSearchQuery)) ||
                    (d.username && d.username.toLowerCase().includes(adminSearchQuery));
            });
            adminPage = 1;
            renderAdminTable();
        }

        function renderAdminTable() {
            var tableBody = document.getElementById('adminTableBody');
            if (!tableBody) return;
            tableBody.innerHTML = '';

            var total = adminFilteredDocs.length;
            var totalPages = Math.max(1, Math.ceil(total / adminPageSize));
            if (adminPage > totalPages) adminPage = totalPages;
            var start = (adminPage - 1) * adminPageSize;
            var end = Math.min(start + adminPageSize, total);
            var pageData = adminFilteredDocs.slice(start, end);

            pageData.forEach(function(admin, idx) {
                var row = document.createElement('tr');
                var aPwId = 'admin-pw-' + admin.docId.replace(/[^a-zA-Z0-9]/g,'_');
                row.innerHTML = `
                    <td>${start + idx + 1}</td>
                    <td><strong>${admin.fname || ''} ${admin.lname || ''}</strong></td>
                    <td>${admin.username || ''}</td>
                    <td>${admin.bday || ''}</td>
                    <td>${admin.address || ''}</td>
                    <td><div class="password-wrap"><div class="password-display" id="${aPwId}" data-show="0" data-pw="">••••••••</div><button class="password-eye-btn" onclick="togglePasswordById('${aPwId}')" title="Show/Hide Password"><i class="fas fa-eye"></i></button></div></td>
                    <td><div class="action-cell">
                        <button class="btn btn-danger btn-small" onclick="confirmDeleteAdmin('${admin.docId}', '${(admin.fname||'') + ' ' + (admin.lname||'')}')"><i class="fas fa-trash"></i> Delete</button>
                    </div></td>
                `;
                var pwEl = row.querySelector('#' + aPwId);
                if (pwEl) pwEl.setAttribute('data-pw', admin.password || '');
                tableBody.appendChild(row);
            });

            var pageInfo = document.getElementById('adminPageInfo');
            var pageIndicator = document.getElementById('adminPageIndicator');
            var prevBtn = document.getElementById('adminPrevBtn');
            var nextBtn = document.getElementById('adminNextBtn');

            if (pageInfo) pageInfo.textContent = total === 0 ? 'No records found' : `Showing ${start + 1}-${end} of ${total} records`;
            if (pageIndicator) pageIndicator.textContent = `Page ${adminPage} of ${totalPages}`;
            if (prevBtn) prevBtn.disabled = adminPage <= 1;
            if (nextBtn) nextBtn.disabled = adminPage >= totalPages;
        }

        function adminPrevPage() { if (adminPage > 1) { adminPage--; renderAdminTable(); } }
        function adminNextPage() {
            var totalPages = Math.max(1, Math.ceil(adminFilteredDocs.length / adminPageSize));
            if (adminPage < totalPages) { adminPage++; renderAdminTable(); }
        }

        async function deleteAdminAccount(docId) {
            await db.collection('SuperAdminAccount').doc(docId).update({ deletestats: 1 });
            showToast('Admin account deleted.', 'success');
            await loadAdminAccounts();
            activities.unshift({ type: 'delete', title: 'Admin Account Deleted', description: docId + ' was removed', time: 'Just now' });
            updateActivityLog();
        }

        async function addSchool(event) {
            event.preventDefault();
            var schoolname = document.getElementById('schoolName').value.trim();
            var schoolabbrev = document.getElementById('schoolAbbreviation').value.trim();
            var schoolpres = document.getElementById('schoolPresident').value.trim();
            var address = document.getElementById('schoolAddress').value.trim();
            var phone = document.getElementById('schoolPhone').value;

            if (!validatePhoneNumber(phone)) {
                showToast('Contact number must be 11 digits (09##-###-####)', 'error');
                document.getElementById('schoolPhone').focus();
                return;
            }

            var emailInput = document.getElementById('schoolEmail').value.trim();
            var emails = emailInput.split(',').map(e => e.trim()).filter(e => e);

            if (emails.length === 0) {
                showToast('Please enter at least one email address', 'error');
                document.getElementById('schoolEmail').focus();
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            for (let email of emails) {
                if (!emailRegex.test(email)) {
                    showToast('Invalid email format: ' + email, 'error');
                    document.getElementById('schoolEmail').focus();
                    return;
                }
            }

            var email_add = emails.join(', ');
            var contact_number = phone;
            var website = document.getElementById('schoolWebsite').value.trim();

            if (website && !website.match(/^https?:\/\/.+/i)) {
                showToast('Please enter a valid website URL starting with http:// or https://', 'error');
                document.getElementById('schoolWebsite').focus();
                return;
            }

            var teaching_staff = parseInt(document.getElementById('teachingStaff').value) || 0;
            var nonteachingstaff = parseInt(document.getElementById('nonTeachingStaff').value) || 0;
            var password = document.getElementById('schoolPassword').value;
            var username = document.getElementById('schoolUsername').value.trim();
            var description = document.getElementById('schoolDescription').value.trim();
            var landline = document.getElementById('schoolLandline').value.trim();

            var _addSchoolBtn = document.getElementById('addSchoolSubmitBtn');
            var _addSchoolBtnOrig = _addSchoolBtn ? _addSchoolBtn.innerHTML : '';
            function _restoreSchoolBtn() { if (_addSchoolBtn) { _addSchoolBtn.disabled = false; _addSchoolBtn.innerHTML = _addSchoolBtnOrig; } }
            if (_addSchoolBtn) { _addSchoolBtn.disabled = true; _addSchoolBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...'; }
            try {
                var snap = await db.collection('ListofSchool').where('deletestats', '==', 0).get();
            for (var i = 0; i < snap.docs.length; i++) {
                var d = snap.docs[i].data();
                if (d.schoolname.toLowerCase() === schoolname.toLowerCase()) {
                    showToast('School Already Exist', 'error'); _restoreSchoolBtn(); return;
                }
                if (d.schoolabbrev.toLowerCase() === schoolabbrev.toLowerCase()) {
                    showToast('School Abbreviation Already Exist', 'error'); _restoreSchoolBtn(); return;
                }
                if (d.username && d.username.toLowerCase() === username.toLowerCase()) {
                    showToast('Username Already Exist', 'error'); try { _restoreSchoolBtn(); } catch(_e) {} return;
                }
            }

            var school_id = await getNextSchoolId(schoolabbrev);

            await db.collection('ListofSchool').doc(school_id).set({
                schoolname: schoolname,
                schoolabbrev: schoolabbrev,
                schoolpres: schoolpres,
                address: address,
                email_add: email_add,
                contact_number: contact_number,
                landline: landline,
                website: website,
                teaching_staff: teaching_staff,
                nonteachingstaff: nonteachingstaff,
                password: password,
                username: username,
                description: description,
                AddedBy: currentUser ? currentUser.username : 'SuperAdmin',
                deletestats: 0,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            showToast(schoolname + ' added successfully!', 'success');
            clearForm();
            closeAddSchoolModal();
            await loadSchoolAccounts();
            updateSchoolCount();

            activities.unshift({
                type: 'add',
                title: 'New School Added',
                description: schoolname + ' was added to the system',
                time: 'Just now'
            });
            updateActivityLog();
            var _addedBy = currentUser ? currentUser.username : 'SuperAdmin';
            saveActivityLog(_addedBy + ' added school "' + schoolname + '".', 'superadmin.html');
            } catch (_addSchoolErr) {
                console.error('addSchool error:', _addSchoolErr);
                showToast('Error adding school: ' + (_addSchoolErr.message || 'Unknown error'), 'error');
            } finally {
                _restoreSchoolBtn();
            }
        }

        async function getNextSchoolId(schoolabbrev) {
            var safeAbbrev = schoolabbrev.replace(/[^a-zA-Z0-9]/g, '');
            var prefix = 'SchoolId_' + safeAbbrev + '_';
            var snap = await db.collection('ListofSchool').get();
            var max = 0;
            snap.forEach(function(doc) {
                if (doc.id.startsWith(prefix)) {
                    var lastPart = doc.id.substring(prefix.length);
                    var num = parseInt(lastPart);
                    if (!isNaN(num)) max = Math.max(max, num);
                }
            });
            return prefix + String(max + 1).padStart(4, '0');
        }

        async function loadSchoolAccounts() {
            try {
                var snap = await db.collection('ListofSchool').where('deletestats', '==', 0).get();
                allSchoolDocs = [];
                snap.forEach(function(doc) {
                    var data = doc.data();
                    data.docId = doc.id;
                    data.status = 'active';
                    data.lastLogin = 'Never';
                    allSchoolDocs.push(data);
                });
                allSchoolDocs.sort(function(a, b) {
                    return (b.timestamp && a.timestamp) ? b.timestamp.seconds - a.timestamp.seconds : 0;
                });
                schoolCredPage = 1;
                refreshSchoolCredentials();
                updateSchoolFilterDropdown();
            } catch(e) {
                console.error('loadSchoolAccounts error:', e);
            }
        }

        function updateSchoolCredFilterDropdown() {
            const select = document.getElementById('schoolCredFilterSelect');
            if (!select) return;
            while (select.options.length > 1) select.remove(1);
            allSchoolDocs.forEach(school => {
                const opt = document.createElement('option');
                opt.value = school.docId;
                opt.textContent = school.schoolname;
                select.appendChild(opt);
            });
        }

        function updateSchoolFilterDropdown() {
            const select = document.getElementById('schoolFilter');
            if (!select) return;
            while (select.options.length > 1) select.remove(1);
            allSchoolDocs.forEach(school => {
                const opt = document.createElement('option');
                opt.value = school.docId;
                opt.textContent = school.schoolname;
                select.appendChild(opt);
            });
        }

        function filterSchoolCredentials() {
            const search = (document.getElementById('schoolCredSearchInput').value || '').toLowerCase();
            const filterVal = document.getElementById('schoolCredFilterSelect').value;

            schoolCredFiltered = allSchoolDocs.filter(school => {
                const matchSearch = !search ||
                    school.schoolname.toLowerCase().includes(search) ||
                    school.email_add.toLowerCase().includes(search) ||
                    (school.schoolpres || '').toLowerCase().includes(search);
                const matchFilter = filterVal === 'all' || String(school.docId) === String(filterVal);
                return matchSearch && matchFilter;
            });

            schoolCredPage = 1;
            renderSchoolCredTable();
        }

        var schoolCredPage = 1;
        var schoolCredPageSize = 5;
        var schoolCredFiltered = [];

        function renderSchoolCredTable() {
            const tableBody = document.getElementById('schoolCredTableBody');
            if (!tableBody) return;
            tableBody.innerHTML = '';

            const total = schoolCredFiltered.length;
            const totalPages = Math.max(1, Math.ceil(total / schoolCredPageSize));
            if (schoolCredPage > totalPages) schoolCredPage = totalPages;
            const start = (schoolCredPage - 1) * schoolCredPageSize;
            const end = Math.min(start + schoolCredPageSize, total);
            const pageData = schoolCredFiltered.slice(start, end);

            pageData.forEach(school => {
                const statusClass = school.status === 'active' ? 'status-active' :
                    school.status === 'inactive' ? 'status-inactive' : 'status-pending';
                const row = document.createElement('tr');
                var sPwId = 'school-pw-' + school.docId.replace(/[^a-zA-Z0-9]/g,'_');
                var safeDocId = school.docId.replace(/'/g, "\\'");
                row.innerHTML = `
                    <td><strong>${school.schoolname}</strong></td>
                    <td>${school.schoolpres || ''}</td>
<td>
    <div style="font-size:0.85rem; line-height:1.4;">
        ${school.email_add.split(',').map(e => `<div>${e.trim()}</div>`).join('')}
    </div>
</td>
                    <td>${school.contact_number || ''}</td>
                    <td>${school.landline || ''}</td>
                    <td><div class="password-wrap"><div class="password-display" id="${sPwId}" data-show="0" data-pw="">••••••••</div><button class="password-eye-btn" onclick="togglePasswordById('${sPwId}')" title="Show/Hide Password"><i class="fas fa-eye"></i></button></div></td>
                    <td><div class="action-cell">
                        <button class="btn btn-secondary btn-small" onclick="openEditSchool('${safeDocId}')" title="Edit"><i class="fas fa-edit"></i> Edit</button>
                        <button class="btn btn-danger btn-small" title="Delete"><i class="fas fa-trash"></i> Delete</button>
                    </div></td>
                `;
                var pwEl = row.querySelector('#' + sPwId);
                if (pwEl) pwEl.setAttribute('data-pw', school.password || '');

                var delBtn = row.querySelector('.btn-danger');
                if (delBtn) delBtn.addEventListener('click', (function(did, nm){
                    return function(){ confirmDeleteSchool(did, nm); };
                })(safeDocId, school.schoolname));

                tableBody.appendChild(row);
            });

            const pageInfo = document.getElementById('schoolCredPageInfo');
            const pageIndicator = document.getElementById('schoolCredPageIndicator');
            const prevBtn = document.getElementById('schoolCredPrevBtn');
            const nextBtn = document.getElementById('schoolCredNextBtn');

            if (pageInfo) pageInfo.textContent = total === 0 ? 'No records found' : `Showing ${start + 1}-${end} of ${total} records`;
            if (pageIndicator) pageIndicator.textContent = `Page ${schoolCredPage} of ${totalPages}`;
            if (prevBtn) prevBtn.disabled = schoolCredPage <= 1;
            if (nextBtn) nextBtn.disabled = schoolCredPage >= totalPages;
        }

        function schoolCredPrevPage() {
            if (schoolCredPage > 1) { schoolCredPage--; renderSchoolCredTable(); }
        }

        function schoolCredNextPage() {
            const totalPages = Math.max(1, Math.ceil(schoolCredFiltered.length / schoolCredPageSize));
            if (schoolCredPage < totalPages) { schoolCredPage++; renderSchoolCredTable(); }
        }

        function refreshSchoolCredentials() {
            schoolCredFiltered = [...allSchoolDocs];
            updateSchoolCredFilterDropdown();
            renderSchoolCredTable();
        }

        async function deleteSchoolAccount(docId) {
            var snap = await db.collection('ListofSchool').doc(docId).get();
            var d = snap.data();
            await db.collection('ListofSchool').doc(docId).update({ deletestats: 1 });
            showToast('School account deleted.', 'success');
            await loadSchoolAccounts();
            updateSchoolCount();
            activities.unshift({
                type: 'delete',
                title: 'School Account Deleted',
                description: (d ? d.schoolname : docId) + ' was removed from the system',
                time: 'Just now'
            });
            updateActivityLog();
        }

async function openEditSchool(docId) {
    try {
        var snap = await db.collection('ListofSchool').doc(docId).get();
        if (!snap.exists) {
            showToast('School not found!', 'error');
            return;
        }
        var d = snap.data();

        document.getElementById('editSchoolDocId').value = docId;
        document.getElementById('editSchoolName').value = d.schoolname || '';
        document.getElementById('editSchoolAbbreviation').value = d.schoolabbrev || '';
        document.getElementById('editSchoolPresident').value = d.schoolpres || '';
        document.getElementById('editSchoolAddress').value = d.address || '';
        document.getElementById('editSchoolEmail').value = d.email_add || '';
        document.getElementById('editSchoolPhone').value = d.contact_number || '';
        document.getElementById('editSchoolLandline').value = d.landline || '';
        document.getElementById('editSchoolWebsite').value = d.website || '';
        document.getElementById('editTeachingStaff').value = d.teaching_staff || 0;
        document.getElementById('editNonTeachingStaff').value = d.nonteachingstaff || 0;
        document.getElementById('editSchoolPassword').value = d.password || '';
        document.getElementById('editSchoolUsername').value = d.username || '';
        document.getElementById('editSchoolDescription').value = d.description || '';

        const modal = document.getElementById('editSchoolModal');
        modal.classList.add('show');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    } catch(e) {
        console.error('Error opening edit school:', e);
        showToast('Error loading school data', 'error');
    }
}

        function closeEditSchoolModal() {
            const modal = document.getElementById('editSchoolModal');
            modal.classList.remove('show');
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }

async function saveEditSchool() {
    try {
        var docId = document.getElementById('editSchoolDocId').value;
        var schoolname = document.getElementById('editSchoolName').value.trim();
        var schoolabbrev = document.getElementById('editSchoolAbbreviation').value.trim();
        var schoolpres = document.getElementById('editSchoolPresident').value.trim();
        var address = document.getElementById('editSchoolAddress').value.trim();
        var emailInput = document.getElementById('editSchoolEmail').value.trim();
        var contact_number = document.getElementById('editSchoolPhone').value;
        var landline = document.getElementById('editSchoolLandline').value.trim();
        var website = document.getElementById('editSchoolWebsite').value.trim();
        var teaching_staff = parseInt(document.getElementById('editTeachingStaff').value) || 0;
        var nonteachingstaff = parseInt(document.getElementById('editNonTeachingStaff').value) || 0;
        var password = document.getElementById('editSchoolPassword').value;
        var username = document.getElementById('editSchoolUsername').value.trim();
        var description = document.getElementById('editSchoolDescription').value.trim();

        if (!validatePhoneNumber(contact_number)) {
            showToast('Contact number must be 11 digits (09##-###-####)', 'error');
            document.getElementById('editSchoolPhone').focus();
            return;
        }

        if (website && !website.match(/^https?:\/\/.+/i)) {
            showToast('Please enter a valid website URL (http:// or https://)', 'error');
            document.getElementById('editSchoolWebsite').focus();
            return;
        }

        var emails = emailInput.split(',').map(e => e.trim()).filter(e => e);
        if (emails.length === 0) {
            showToast('Please enter at least one email address', 'error');
            document.getElementById('editSchoolEmail').focus();
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        for (let email of emails) {
            if (!emailRegex.test(email)) {
                showToast('Invalid email format: ' + email, 'error');
                document.getElementById('editSchoolEmail').focus();
                return;
            }
        }
        var email_add = emails.join(', ');

        var snap = await db.collection('ListofSchool').where('deletestats', '==', 0).get();
        for (var i = 0; i < snap.docs.length; i++) {
            if (snap.docs[i].id === docId) continue;
            var d = snap.docs[i].data();
            if (d.schoolname.toLowerCase() === schoolname.toLowerCase()) {
                showToast('School name already exists!', 'error');
                return;
            }
            if (d.schoolabbrev.toLowerCase() === schoolabbrev.toLowerCase()) {
                showToast('School abbreviation already exists!', 'error');
                return;
            }
            if (d.username && d.username.toLowerCase() === username.toLowerCase()) {
                showToast('Username already exists!', 'error');
                return;
            }
        }

        await db.collection('ListofSchool').doc(docId).update({
            schoolname: schoolname,
            schoolabbrev: schoolabbrev,
            schoolpres: schoolpres,
            address: address,
            email_add: email_add,
            contact_number: contact_number,
            landline: landline,
            teaching_staff: teaching_staff,
            nonteachingstaff: nonteachingstaff,
            password: password,
            username: username,
            description: description,
            website: website
        });

        showToast(schoolname + ' updated successfully!', 'success');
        closeEditSchoolModal();
        await loadSchoolAccounts();
        updateSchoolCount();

        activities.unshift({
            type: 'edit',
            title: 'School Updated',
            description: `${schoolname} was updated`,
            time: 'Just now'
        });
        updateActivityLog();
        var _by = currentUser ? currentUser.username : 'SuperAdmin';
        saveActivityLog(_by + ' edited school "' + schoolname + '".', 'superadmin.html');
    } catch(e) {
        console.error('Error saving school:', e);
        showToast('Error saving school: ' + e.message, 'error');
    }
}
// ── EDIT COURSE FUNCTIONS ──

async function openEditCourse(courseDocId) {
    try {
        var snap = await db.collection('COURSE').doc(courseDocId).get();
        if (!snap.exists) {
            showToast('Course not found!', 'error');
            return;
        }
        var d = snap.data();

        var schoolSel = document.getElementById('editCourseSchool');
        schoolSel.innerHTML = '<option value="">Select School</option>';
        allSchoolDocs.forEach(function(school) {
            var opt = document.createElement('option');
            opt.value = school.docId;
            opt.textContent = school.schoolname;
            if (school.docId === d.School) opt.selected = true;
            schoolSel.appendChild(opt);
        });

        document.getElementById('editCourseDocId').value = courseDocId;
        document.getElementById('editCourseName').value = d.SchoolCourse || '';
        document.getElementById('editCourseEdu').value = d.EducationalAttainment || '';

        document.getElementById('editCourseModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    } catch(e) {
        console.error('Error opening edit course:', e);
        showToast('Error loading course data', 'error');
    }
}

function closeEditCourseModal() {
    document.getElementById('editCourseModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

async function saveEditCourse() {
    try {
        var docId = document.getElementById('editCourseDocId').value;
        var courseName = document.getElementById('editCourseName').value.trim();
        var schoolVal = document.getElementById('editCourseSchool').value;
        var eduLevel = document.getElementById('editCourseEdu').value;

        if (!courseName || !schoolVal || !eduLevel) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        var oldSnap = await db.collection('COURSE').doc(docId).get();
        var oldData = oldSnap.data();

        var dupSnap = await db.collection('COURSE')
            .where('School', '==', schoolVal)
            .where('EducationalAttainment', '==', eduLevel)
            .where('SchoolCourse', '==', courseName)
            .where('deletestats', '==', 0)
            .get();

        for (var i = 0; i < dupSnap.docs.length; i++) {
            if (dupSnap.docs[i].id !== docId) {
                showToast('This course already exists for this school and level!', 'error');
                return;
            }
        }

        await db.collection('COURSE').doc(docId).update({
            SchoolCourse: courseName,
            School: schoolVal,
            EducationalAttainment: eduLevel,
            SchoolName: allSchoolDocs.find(s => s.docId === schoolVal)?.schoolname || '',
            SchoolAbbrev: allSchoolDocs.find(s => s.docId === schoolVal)?.schoolabbrev || ''
        });

        showToast('Course updated successfully!', 'success');
        closeEditCourseModal();
        filterCourseList();
        // Invalidate course cache and reload
        var cacheKey = currentSchool + '_' + currentEducationalLevel;
        _courseLoadCache[cacheKey] = false;
        loadCoursesFromFirestore();
        const clSection = document.getElementById('add-course');
        if (clSection && clSection.classList.contains('active')) { clLoadCoursesFromFirestore(); }

        activities.unshift({
            type: 'edit',
            title: 'Course Updated',
            description: `"${courseName}" was updated`,
            time: 'Just now'
        });
        updateActivityLog();
        var _by = currentUser ? currentUser.username : 'SuperAdmin';
        saveActivityLog(_by + ' edited course "' + courseName + '".', 'superadmin.html');
    } catch(e) {
        console.error('Error saving course:', e);
        showToast('Error saving course: ' + e.message, 'error');
    }
}

async function deleteCourse(courseDocId, courseName) {
    if (confirm(`Delete course "${courseName}"? This cannot be undone.`)) {
        try {
            await db.collection('COURSE').doc(courseDocId).update({ deletestats: 1 });
            showToast('Course deleted successfully!', 'success');
            filterCourseList();
            var cacheKey = currentSchool + '_' + currentEducationalLevel;
            _courseLoadCache[cacheKey] = false;
            loadCoursesFromFirestore();

            activities.unshift({
                type: 'delete',
                title: 'Course Deleted',
                description: `"${courseName}" was deleted`,
                time: 'Just now'
            });
            updateActivityLog();
        } catch(e) {
            console.error('Error deleting course:', e);
            showToast('Error deleting course', 'error');
        }
    }
}
        function updateSchoolCount() {
            const totalSchoolsElement = document.getElementById('totalSchoolsCount');
            if (totalSchoolsElement) {
                totalSchoolsElement.textContent = allSchoolDocs.length;
            }
            const slSection = document.getElementById('add-school');
            if (slSection && slSection.classList.contains('active')) {
                slPopulateFilter();
                slFilterSchools();
            } else {
                slFiltered = allSchoolDocs.slice();
            }
        }

        // Course management
        let courseList = [];
        let courseListPage = 1;
        const courseListPageSize = 5;
        let courseListFiltered = [];

        function updateCourseSchoolDropdowns() {
            const selectors = ['newCourseSchool', 'courseListSchoolFilter'];
            selectors.forEach(id => {
                const sel = document.getElementById(id);
                if (!sel) return;
                while (sel.options.length > 1) sel.remove(1);
                allSchoolDocs.forEach(school => {
                    const opt = document.createElement('option');
                    opt.value = school.docId;
                    opt.textContent = school.schoolname;
                    sel.appendChild(opt);
                });
            });
        }

        function addCourseEntry(event) {
            event.preventDefault();
            const name = document.getElementById('newCourseName').value.trim();
            const schoolSel = document.getElementById('newCourseSchool');
            const schoolVal = schoolSel.value;
            const schoolLabel = schoolSel.options[schoolSel.selectedIndex].text;

            if (!name) { alert('Please enter a course name.'); return; }

            const newEntry = { id: Date.now(), name, school: schoolVal, schoolLabel };
            courseList.push(newEntry);

            const targetKey = 'all';
            if (!schoolsData[targetKey]) schoolsData[targetKey] = { enrollees:{}, outside:{}, inside:{}, graduates:{}, passers:{} };
            ['enrollees','outside','inside','graduates','passers'].forEach(cat => {
                if (!schoolsData[targetKey][cat][name]) {
                    schoolsData[targetKey][cat][name] = new Array(academicYears.length).fill(0).map(() => ({male:0, female:0}));
                }
            });

            filterCourseList();
            document.getElementById('addCourseForm').reset();

            activities.unshift({
                type: 'add',
                title: 'New Course Added',
                description: `"${name}" added for ${schoolLabel}`,
                time: 'Just now'
            });
            updateActivityLog();
            updateUnifiedTable();
            updateSummary();

            alert(`Course "${name}" added successfully!`);
        }

        function deleteCourseEntry(id) {
            const entry = courseList.find(c => String(c.id) === String(id));
            if (!entry) return;
            if (confirm(`Delete course "${entry.name}"?`)) {
                courseList = courseList.filter(c => String(c.id) !== String(id));
                ['enrollees','outside','inside','graduates','passers'].forEach(cat => {
                    if (schoolsData['all'] && schoolsData['all'][cat]) {
                        delete schoolsData['all'][cat][entry.name];
                    }
                });
                const totalPages = Math.max(1, Math.ceil(courseListFiltered.length / courseListPageSize));
                if (courseListPage > totalPages) courseListPage = totalPages;
                filterCourseList();
                updateUnifiedTable();
                updateSummary();
                activities.unshift({
                    type: 'delete',
                    title: 'Course Deleted',
                    description: `"${entry.name}" was removed`,
                    time: 'Just now'
                });
                updateActivityLog();
            }
        }

        function filterCourseList() {
            const search = (document.getElementById('courseListSearch') ? document.getElementById('courseListSearch').value : '').toLowerCase();
            const filterVal = document.getElementById('courseListSchoolFilter') ? document.getElementById('courseListSchoolFilter').value : 'all';

            courseListFiltered = courseList.filter(c => {
                const matchSearch = !search || c.name.toLowerCase().includes(search);
                const matchFilter = filterVal === 'all' || String(c.school) === String(filterVal) || c.school === 'all';
                return matchSearch && matchFilter;
            });

            courseListPage = 1;
            renderCourseListTable();
        }

        function renderCourseListTable() {
            const tableBody = document.getElementById('courseListTableBody');
            if (!tableBody) return;
            tableBody.innerHTML = '';

            const total = courseListFiltered.length;
            const totalPages = Math.max(1, Math.ceil(total / courseListPageSize));
            if (courseListPage > totalPages) courseListPage = totalPages;
            const start = (courseListPage - 1) * courseListPageSize;
            const end = Math.min(start + courseListPageSize, total);
            const pageData = courseListFiltered.slice(start, end);

            pageData.forEach((c, idx) => {
                const row = document.createElement('tr');
                const isFirestoreId = typeof c.id === 'string';
                row.innerHTML = `
                    <td>${start + idx + 1}</td>
                    <td><strong>${c.name}</strong></td>
                    <td>${c.schoolLabel || 'All Schools'}</td>
                    <td>${c.eduLevel || '—'}</td>
                    <td style="white-space:nowrap;">
                        ${isFirestoreId ? `<button class="btn btn-warning btn-small" onclick="openEditCourse('${c.id}')" title="Edit" style="margin-right:4px;"><i class="fas fa-edit"></i></button>` : ''}
                        <button class="btn btn-danger btn-small" onclick="deleteCourseEntry('${c.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            const pageInfo = document.getElementById('courseListPageInfo');
            const pageIndicator = document.getElementById('courseListPageIndicator');
            const prevBtn = document.getElementById('courseListPrevBtn');
            const nextBtn = document.getElementById('courseListNextBtn');

            if (pageInfo) pageInfo.textContent = total === 0 ? 'No courses yet' : `Showing ${start + 1}-${end} of ${total} records`;
            if (pageIndicator) pageIndicator.textContent = `Page ${courseListPage} of ${totalPages}`;
            if (prevBtn) prevBtn.disabled = courseListPage <= 1;
            if (nextBtn) nextBtn.disabled = courseListPage >= totalPages;
        }

        function courseListPrevPage() {
            if (courseListPage > 1) { courseListPage--; renderCourseListTable(); }
        }

        function courseListNextPage() {
            const totalPages = Math.max(1, Math.ceil(courseListFiltered.length / courseListPageSize));
            if (courseListPage < totalPages) { courseListPage++; renderCourseListTable(); }
        }

        function initCourseListFromData() {
            const existingCourses = Object.keys(schoolsData['all'] ? schoolsData['all']['enrollees'] || {} : {});
            courseList = existingCourses.map((name, i) => ({
                id: i + 1,
                name,
                school: 'all',
                schoolLabel: 'All Schools'
            }));
            courseListFiltered = [...courseList];
            renderCourseListTable();
        }

function openAddCourseModal() {
    var sel = document.getElementById('modalCourseSchool');
    if (sel) {
        while (sel.options.length > 1) sel.remove(1);
        allSchoolDocs.forEach(function(school) {
            var opt = document.createElement('option');
            opt.value = school.docId;
            opt.textContent = school.schoolname;
            sel.appendChild(opt);
        });
    }
    document.getElementById('addCourseModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}


function closeAddCourseModal() {
    document.getElementById('addCourseModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('sidebarAddCourseForm').reset();
}

async function submitAddCourseModal(event) {
    event.preventDefault();

    var schoolSel = document.getElementById('modalCourseSchool');
    var schoolVal = schoolSel.value;
    var schoolLabel = schoolSel.options[schoolSel.selectedIndex].text;
    var schoolDoc = allSchoolDocs.find(function(s) { return s.docId === schoolVal; });
    var schoolAbbrev = schoolDoc ? schoolDoc.schoolabbrev : schoolLabel;

    var eduLevel = document.getElementById('modalEduAttainment').value;
    var courseName = document.getElementById('modalCourseName').value.trim();

    if (!courseName || !eduLevel || !schoolVal) return;

    var dupSnap = await db.collection('COURSE')
        .where('School', '==', schoolVal)
        .where('EducationalAttainment', '==', eduLevel)
        .where('SchoolCourse', '==', courseName)
        .where('deletestats', '==', 0)
        .get();

    if (!dupSnap.empty) {
        showToast('Course already exists for this school and educational level!', 'error');
        return;
    }

    var docId = await getNextCourseId(schoolAbbrev, eduLevel);
    var courseIdNum = docId.split('_').pop();

    await db.collection('COURSE').doc(docId).set({
        SchoolCourse: courseName,
        AddedBy: currentUser ? currentUser.username : 'SuperAdmin',
        TimeStamp: firebase.firestore.FieldValue.serverTimestamp(),
        CourseID: courseIdNum,
        EducationalAttainment: eduLevel,
        School: schoolVal,
        SchoolName: schoolLabel,
        SchoolAbbrev: schoolAbbrev,
        deletestats: 0
    });

    if (!schoolsData[schoolVal]) {
        schoolsData[schoolVal] = { enrollees:{}, outside:{}, inside:{}, graduates:{}, passers:{} };
    }
    ['enrollees','outside','inside','graduates','passers'].forEach(function(cat) {
        schoolsData[schoolVal][cat][courseName] = new Array(academicYears.length).fill(0).map(function() {
            return { male: 0, female: 0 };
        });
        if (!schoolsData['all'][cat][courseName]) {
            schoolsData['all'][cat][courseName] = new Array(academicYears.length).fill(0).map(function() {
                return { male: 0, female: 0 };
            });
        }
    });

    courseList.push({
        id: Date.now(),
        name: courseName,
        school: schoolVal,
        schoolLabel: schoolLabel,
        eduLevel: eduLevel
    });

    updateUnifiedTable();
    updateSummary();
    filterCourseList();

    showToast('"' + courseName + '" added successfully!', 'success');
    activities.unshift({
        type: 'add',
        title: 'New Course Added',
        description: '"' + courseName + '" (' + eduLevel + ') added for ' + schoolLabel,
        time: 'Just now'
    });
    updateActivityLog();
    var _courseAddedBy = currentUser ? currentUser.username : 'SuperAdmin';
    saveActivityLog(_courseAddedBy + ' added course "' + courseName + '" (' + eduLevel + ') for ' + schoolLabel + '.', 'superadmin.html');
    closeAddCourseModal();
    const clSectionAdd = document.getElementById('add-course');
    if (clSectionAdd && clSectionAdd.classList.contains('active')) { clLoadCoursesFromFirestore(); }
}
// Auto-increment CourseID per school+educational attainment combination
async function getNextCourseId(schoolAbbrev, eduAttainment) {
    var safeSchool = schoolAbbrev.replace(/[^a-zA-Z0-9]/g, '');
    var safeEdu = eduAttainment.replace(/[^a-zA-Z0-9]/g, '_');
    var prefix = safeSchool + '_' + safeEdu;

    var snap = await db.collection('COURSE').get();
    var max = 0;
    snap.forEach(function(doc) {
        if (doc.id.startsWith(prefix + '_')) {
            var lastPart = doc.id.substring(prefix.length + 1);
            var num = parseInt(lastPart);
            if (!isNaN(num)) max = Math.max(max, num);
        }
    });
    return prefix + '_' + String(max + 1).padStart(4, '0');
}

// Load courses from Firestore with caching — filters to BOTH currentSchool AND currentEducationalLevel
async function loadCoursesFromFirestore() {
    if (currentSchool === 'all' || currentEducationalLevel === 'all') {
        // When either filter is 'all', show empty table (no cross-school mixing)
        courseList = courseList.filter(function(c) {
            return c._persisted !== true;
        });
        updateUnifiedTable();
        updateSummary();
        filterCourseList();
        return;
    }

    var cacheKey = currentSchool + '_' + currentEducationalLevel;
    if (_courseLoadCache[cacheKey]) {
        updateUnifiedTable();
        updateSummary();
        filterCourseList();
        return;
    }

    try {
        var eduMap = {
            'bachelor': 'BACHELOR DEGREE',
            'twoyear': '2-YEAR COURSE',
            'tesda': 'TESDA',
            'graduate': 'GRADUATE COURSE'
        };
        var targetEduLabel = eduMap[currentEducationalLevel];

        // Remove stale entries for this school+edu combo before re-fetching
        courseList = courseList.filter(function(c) {
            return !(c.school === currentSchool && c.eduLevel === targetEduLabel);
        });

        var query = db.collection('COURSE')
            .where('deletestats', '==', 0)
            .where('School', '==', currentSchool)
            .where('EducationalAttainment', '==', targetEduLabel);

        var snap = await query.get();

        snap.forEach(function(doc) {
            var d = doc.data();
            var targetKey = d.School || 'all';

            if (!schoolsData[targetKey]) {
                schoolsData[targetKey] = { enrollees:{}, outside:{}, inside:{}, graduates:{}, passers:{} };
            }
            ['enrollees','outside','inside','graduates','passers'].forEach(function(cat) {
                if (!schoolsData[targetKey][cat][d.SchoolCourse]) {
                    schoolsData[targetKey][cat][d.SchoolCourse] = new Array(academicYears.length).fill(0).map(function() {
                        return { male: 0, female: 0 };
                    });
                }
                if (!schoolsData['all'][cat][d.SchoolCourse]) {
                    schoolsData['all'][cat][d.SchoolCourse] = new Array(academicYears.length).fill(0).map(function() {
                        return { male: 0, female: 0 };
                    });
                }
            });

            var alreadyInList = courseList.find(function(c) { return c.name === d.SchoolCourse && c.school === d.School; });
            if (!alreadyInList) {
                courseList.push({
                    id: doc.id,
                    name: d.SchoolCourse,
                    school: d.School,
                    schoolLabel: d.SchoolName || '',
                    eduLevel: d.EducationalAttainment || ''
                });
            }
        });

        _courseLoadCache[cacheKey] = true;
        updateUnifiedTable();
        updateSummary();
        filterCourseList();

    } catch(e) {
        console.error('loadCoursesFromFirestore error:', e);
    }
}

   // Initialize the dashboard
        document.addEventListener('DOMContentLoaded', function() {
            checkExistingSession();

            updateActivityLog();
            initYearWindowStart();
            renderYearNavigator();
            updateUnifiedTableHeaders();
            updateUnifiedTable();
            updateSummary();
            initCourseListFromData();

            // Load admin accounts and schools in parallel for speed
            Promise.all([
                loadAdminAccounts(),
                loadSchoolAccounts()
            ]).then(function() {
                slFiltered = allSchoolDocs.slice();
            });

            // FEATURE 3 & 4: Load settings and apply to UI on startup
            loadSettingsFromFirebase().then(function(settings) {
                applySettingsToUI(settings);

                // FEATURE 5: Check if daily/weekly/monthly backup needed
                var freq = settings.BackupFrequency || '';
                if (freq === 'daily') {
                    checkAndRunDailyBackup();
                } else if (freq === 'weekly') {
                    checkAndRunWeeklyBackup();
                } else if (freq === 'monthly') {
                    checkAndRunMonthlyBackup();
                }
            });

            document.documentElement.style.scrollBehavior = 'smooth';

            document.addEventListener('click', function(event) {
                const userDropdown = document.getElementById('userDropdown');
                const userDropdownContent = document.getElementById('userDropdownContent');
                if (userDropdown && !userDropdown.contains(event.target)) {
                    userDropdownContent.classList.remove('show');
                }
                const mobileUserDropdown = document.getElementById('mobileUserDropdown');
                const mobileUserDropdownContent = document.getElementById('mobileUserDropdownContent');
                if (mobileUserDropdown && !mobileUserDropdown.contains(event.target)) {
                    mobileUserDropdownContent.classList.remove('show');
                }
            });
        });

        // Helper function to load data from Firestore (one-time .get()) and update UI
        async function loadDataFromFirestoreAndUpdate() {
            try {
                if (currentSchool === 'all' || currentEducationalLevel === 'all') {
                    updateUnifiedTable();
                    updateSummary();
                    return;
                }

                var cacheKey = currentSchool + '_' + currentEducationalLevel + '_' + currentFilter;
                if (_dataLoadCache[cacheKey]) {
                    updateUnifiedTable();
                    updateSummary();
                    return;
                }

                const loadedData = await loadDataFromFirestore(currentSchool, currentEducationalLevel, currentFilter);

                const targetKey = currentSchool || 'all';
                const targetCategory = currentFilter || 'enrollees';

                if (!schoolsData[targetKey]) {
                    schoolsData[targetKey] = { enrollees:{}, outside:{}, inside:{}, graduates:{}, passers:{} };
                }
                if (!schoolsData[targetKey][targetCategory]) {
                    schoolsData[targetKey][targetCategory] = {};
                }

                Object.keys(loadedData).forEach(courseName => {
                    if (!schoolsData[targetKey][targetCategory][courseName]) {
                        schoolsData[targetKey][targetCategory][courseName] = new Array(academicYears.length).fill(0).map(() => ({male:0, female:0}));
                    }

                    Object.keys(loadedData[courseName]).forEach(year => {
                        const yearIndex = academicYears.indexOf(year);
                        if (yearIndex !== -1) {
                            schoolsData[targetKey][targetCategory][courseName][yearIndex] = loadedData[courseName][year];
                        }
                    });
                });

                const sortedCourses = Object.keys(schoolsData[targetKey][targetCategory]).sort();
                const sortedData = {};
                sortedCourses.forEach(course => {
                    sortedData[course] = schoolsData[targetKey][targetCategory][course];
                });
                schoolsData[targetKey][targetCategory] = sortedData;

                _dataLoadCache[cacheKey] = true;
                updateUnifiedTable();
                updateSummary();
            } catch (error) {
                console.error('Error loading data from Firestore:', error);
            }
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'n':
                        e.preventDefault();
                        showSection('add-school');
                        setTimeout(() => document.getElementById('schoolName').focus(), 100);
                        break;
                    case 'r':
                        e.preventDefault();
                        clearForm();
                        break;
                    case 's':
                        e.preventDefault();
                        saveData();
                        break;
                    case 'a':
                        if (e.shiftKey) {
                            e.preventDefault();
                            addNewCourse();
                        }
                        break;
                }
            }
        });

        // Modal keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const logoutModal = document.getElementById('logoutConfirmModal');
                if (logoutModal && logoutModal.style.display === 'flex') { closeLogoutModal(); return; }
                const activeModal = document.querySelector('.modal[style*="block"]');
                if (activeModal) {
                    activeModal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
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


  // =============================================
// ACTIVITY LOG MODULE
// =============================================
const activityLogState = {
    allDocs: [], filtered: [], currentPage: 1, perPage: 10,
    sortAsc: false, searchQuery: "", filterUsername: "",
    filterSchool: "", filterRole: "", isLoading: false, initialized: false,
};

async function initActivityLog() {
    if (activityLogState.isLoading) return;
    activityLogState.isLoading = true;
    showActivityLogState("loading");
    spinRefreshBtn(true);
    activityLogState.initialized = false;
    try {
        const snapshot = await db.collection("ActivityLog").orderBy("TimeStamp", "desc").get();
        activityLogState.allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        populateActivityLogDropdowns();
        applyActivityLogFilters();
        activityLogState.initialized = true;
    } catch (err) {
        console.error("[ActivityLog] error:", err);
        showActivityLogState("error", err.message || "Failed to load activity logs.");
    } finally {
        activityLogState.isLoading = false;
        spinRefreshBtn(false);
    }
}

function populateActivityLogDropdowns() {
    const docs = activityLogState.allDocs;
    const usernames = [...new Set(docs.map(d => d.Username).filter(Boolean))].sort();
    const usernameSelect = document.getElementById("alUsernameFilter");
    if (usernameSelect) {
        usernameSelect.innerHTML = '<option value="">All Users</option>';
        usernames.forEach(u => {
            const opt = document.createElement("option");
            opt.value = u; opt.textContent = u;
            usernameSelect.appendChild(opt);
        });
    }
    const schoolSelect = document.getElementById("alSchoolFilter");
    if (schoolSelect && Array.isArray(allSchoolDocs)) {
        schoolSelect.innerHTML = '<option value="">All Schools</option>';
        allSchoolDocs.forEach(school => {
            const opt = document.createElement("option");
            opt.value = school.docId; opt.textContent = school.schoolname || school.docId;
            schoolSelect.appendChild(opt);
        });
    }
    const roles = [...new Set(docs.map(d => d.AccountRole).filter(Boolean))].sort();
    const roleSelect = document.getElementById("alRoleFilter");
    if (roleSelect) {
        roleSelect.innerHTML = '<option value="">All Roles</option>';
        roles.forEach(r => {
            const opt = document.createElement("option");
            opt.value = r; opt.textContent = alCapFirst(r);
            roleSelect.appendChild(opt);
        });
    }
}

function applyActivityLogFilters() {
    const state = activityLogState;
    const q = state.searchQuery.toLowerCase().trim();
    let results = [...state.allDocs].sort((a, b) => {
        const tA = alToMs(a.TimeStamp), tB = alToMs(b.TimeStamp);
        return state.sortAsc ? tA - tB : tB - tA;
    });
    if (state.filterUsername) {
        results = results.filter(d => (d.Username || "").toLowerCase() === state.filterUsername.toLowerCase());
    }
    if (state.filterSchool) {
        const school = (allSchoolDocs || []).find(s => s.docId === state.filterSchool);
        if (school) {
            const schoolAbbrev = (school.schoolabbrev || "").toLowerCase();
            results = results.filter(d => {
                const uid = (d.UserID || "").toLowerCase();
                const uname = (d.Username || "").toLowerCase();
                return uid.includes(schoolAbbrev) || uname.includes(schoolAbbrev);
            });
        }
    }
    if (state.filterRole) {
        results = results.filter(d => (d.AccountRole || "").toLowerCase() === state.filterRole.toLowerCase());
    }
    if (q) {
        results = results.filter(d => {
            return (d.Description || "").toLowerCase().includes(q) ||
                   (d.Username || "").toLowerCase().includes(q) ||
                   (d.Location || "").toLowerCase().includes(q) ||
                   (d.ActivityID || "").toLowerCase().includes(q) ||
                   (d.UserID || "").toLowerCase().includes(q);
        });
    }
    state.filtered = results;
    state.currentPage = 1;
    renderActivityLogPage();
    updateActivityLogStats();
    updateAlPills();
    updateAlFilterStyles();
}

function renderActivityLogPage() {
    const state = activityLogState;
    const { filtered, currentPage, perPage } = state;
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    if (state.currentPage > totalPages) state.currentPage = totalPages;
    const start = (currentPage - 1) * perPage;
    const pageItems = filtered.slice(start, start + perPage);
    if (filtered.length === 0) { showActivityLogState("empty"); return; }
    showActivityLogState("table");
    const tbody = document.getElementById("alTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    pageItems.forEach((doc, idx) => tbody.appendChild(buildAlRow(doc, start + idx + 1)));
    renderAlPagination(totalPages);
}

function buildAlRow(doc, rowNum) {
    const tr = document.createElement("tr");
    const { dateStr, timeStr } = alFormatTs(doc.TimeStamp);
    const username = doc.Username || "—";
    const role = doc.AccountRole || "";
    const desc = doc.Description || "—";
    const location = doc.Location || "—";
    const initials = username.substring(0, 2).toUpperCase();
    const rowId = "alrow-" + (doc.id || rowNum).toString().replace(/[^a-zA-Z0-9]/g, "_");
    tr.innerHTML = `
        <td class="al-td al-td-num">${rowNum}</td>
        <td class="al-td al-td-time">
            <span class="al-time-date">${alEsc(dateStr)}</span>
            <span class="al-time-clock">${alEsc(timeStr)}</span>
        </td>
        <td class="al-td al-td-user">
            <div class="al-username-wrap">
                <span class="al-avatar" style="${alAvatarColor(username)}">${alEsc(initials)}</span>
                <span class="al-username-text">${alEsc(username)}</span>
            </div>
        </td>
        <td class="al-td al-td-role">
            <span class="al-role-badge ${alRoleClass(role)}">${alEsc(alCapFirst(role)) || "—"}</span>
        </td>
        <td class="al-td al-td-desc">
            <div class="al-desc-text" id="desc-${rowId}">${alEsc(desc)}</div>
            ${desc.length > 100 ? `<button class="al-desc-toggle" onclick="toggleAlDesc('desc-${rowId}',this)">Show more</button>` : ""}
        </td>
        <td class="al-td al-td-loc">
            <span class="al-location-chip"><i class="fas fa-file-code" style="font-size:.7rem;"></i> ${alEsc(location)}</span>
        </td>`;
    return tr;
}

function renderAlPagination(totalPages) {
    const current = activityLogState.currentPage;
    const pageInfo = document.getElementById("alPageInfo");
    const pageNums = document.getElementById("alPageNumbers");
    const firstBtn = document.getElementById("alFirstBtn");
    const prevBtn  = document.getElementById("alPrevBtn");
    const nextBtn  = document.getElementById("alNextBtn");
    const lastBtn  = document.getElementById("alLastBtn");
    const pag      = document.getElementById("alPagination");
    if (!pag) return;
    if (totalPages <= 1) { pag.style.display = "none"; return; }
    pag.style.display = "flex";
    if (pageInfo) pageInfo.textContent = `Page ${current} of ${totalPages}`;
    if (firstBtn) firstBtn.disabled = current === 1;
    if (prevBtn)  prevBtn.disabled  = current === 1;
    if (nextBtn)  nextBtn.disabled  = current === totalPages;
    if (lastBtn)  lastBtn.disabled  = current === totalPages;
    if (pageNums) {
        pageNums.innerHTML = "";
        alBuildPageRange(current, totalPages).forEach(p => {
            if (p === "...") {
                const s = document.createElement("span");
                s.className = "al-page-ellipsis"; s.textContent = "…";
                pageNums.appendChild(s);
            } else {
                const btn = document.createElement("button");
                btn.className = "al-page-num-btn" + (p === current ? " al-page-active" : "");
                btn.textContent = p;
                btn.onclick = () => goToActivityLogPage(p);
                pageNums.appendChild(btn);
            }
        });
    }
}

function alBuildPageRange(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = [], left = Math.max(2, current - 2), right = Math.min(total - 1, current + 2);
    pages.push(1);
    if (left > 2) pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < total - 1) pages.push("...");
    pages.push(total);
    return pages;
}

function updateActivityLogStats() {
    const filtered = activityLogState.filtered;
    const todayStr = new Date().toDateString();
    const todayCount = filtered.filter(d => { const ms = alToMs(d.TimeStamp); return ms && new Date(ms).toDateString() === todayStr; }).length;
    const uniqueUsers = new Set(filtered.map(d => d.Username).filter(Boolean)).size;
    const badge = document.getElementById("alTotalBadge");
    if (badge) badge.textContent = `${activityLogState.allDocs.length.toLocaleString()} total`;
    const ss = document.getElementById("alStatShowing");
    if (ss) ss.textContent = `Showing ${filtered.length.toLocaleString()} result${filtered.length !== 1 ? "s" : ""}`;
    const st = document.getElementById("alStatToday");
    if (st) st.textContent = `Today: ${todayCount.toLocaleString()}`;
    const su = document.getElementById("alStatUniqueUsers");
    if (su) su.textContent = `Users: ${uniqueUsers.toLocaleString()}`;
}

function updateAlPills() {
    const state = activityLogState;
    const container = document.getElementById("alActiveFilters");
    if (!container) return;
    const pills = [];
    if (state.searchQuery) pills.push({ label: `Search: "${state.searchQuery}"`, clear: () => { state.searchQuery = ""; document.getElementById("alSearchInput").value = ""; alToggleClear(); applyActivityLogFilters(); } });
    if (state.filterUsername) pills.push({ label: `User: ${state.filterUsername}`, clear: () => { state.filterUsername = ""; document.getElementById("alUsernameFilter").value = ""; applyActivityLogFilters(); } });
    if (state.filterSchool) {
        const school = (allSchoolDocs || []).find(s => s.docId === state.filterSchool);
        const schoolName = school ? school.schoolname : state.filterSchool;
        pills.push({ label: `School: ${schoolName}`, clear: () => { state.filterSchool = ""; const el = document.getElementById("alSchoolFilter"); if (el) el.value = ""; applyActivityLogFilters(); } });
    }
    if (state.filterRole) pills.push({ label: `Role: ${alCapFirst(state.filterRole)}`, clear: () => { state.filterRole = ""; const el = document.getElementById("alRoleFilter"); if (el) el.value = ""; applyActivityLogFilters(); } });
    if (!pills.length) { container.style.display = "none"; return; }
    container.style.display = "flex"; container.innerHTML = "";
    pills.forEach(pill => {
        const span = document.createElement("span"); span.className = "al-pill";
        span.innerHTML = alEsc(pill.label) + ' <button class="al-pill-remove" title="Remove"><i class="fas fa-times"></i></button>';
        span.querySelector("button").addEventListener("click", pill.clear);
        container.appendChild(span);
    });
}

function updateAlFilterStyles() {
    const state = activityLogState;
    [["alUsernameFilter", state.filterUsername], ["alSchoolFilter", state.filterSchool], ["alRoleFilter", state.filterRole]].forEach(function(pair) {
        const el = document.getElementById(pair[0]);
        if (!el) return;
        pair[1] ? el.classList.add("al-filter-active") : el.classList.remove("al-filter-active");
    });
}

function showActivityLogState(state, message) {
    ["alLoading", "alError", "alEmpty", "alTableWrap"].forEach(function(id) { const el = document.getElementById(id); if (el) el.style.display = "none"; });
    const statsRow = document.getElementById("alStatsRow");
    const pag = document.getElementById("alPagination");
    if (statsRow) statsRow.style.display = (state === "table" || state === "empty") ? "flex" : "none";
    if (pag) pag.style.display = "none";
    const map = { loading: "alLoading", error: "alError", empty: "alEmpty", table: "alTableWrap" };
    const target = document.getElementById(map[state]);
    if (target) target.style.display = (state === "table") ? "block" : "flex";
    if (state === "error") { const msg = document.getElementById("alErrorMsg"); if (msg) msg.textContent = message || "Failed to load activity logs."; }
}

function onActivityLogFilter() {
    const state = activityLogState;
    state.searchQuery    = document.getElementById("alSearchInput")?.value    || "";
    state.filterUsername = document.getElementById("alUsernameFilter")?.value || "";
    state.filterSchool   = document.getElementById("alSchoolFilter")?.value   || "";
    state.filterRole     = document.getElementById("alRoleFilter")?.value     || "";
    alToggleClear();
    applyActivityLogFilters();
}

function clearActivityLogSearch() {
    const input = document.getElementById("alSearchInput");
    if (input) input.value = "";
    activityLogState.searchQuery = "";
    alToggleClear();
    applyActivityLogFilters();
}

function clearAllActivityLogFilters() {
    activityLogState.searchQuery = activityLogState.filterUsername = activityLogState.filterSchool = activityLogState.filterRole = "";
    const input = document.getElementById("alSearchInput");
    if (input) input.value = "";
    ["alUsernameFilter", "alSchoolFilter", "alRoleFilter"].forEach(function(id) { const el = document.getElementById(id); if (el) el.value = ""; });
    alToggleClear();
    applyActivityLogFilters();
}

function alToggleClear() {
    const val = (document.getElementById("alSearchInput")?.value || "").trim();
    const btn = document.getElementById("alSearchClear");
    if (btn) btn.style.display = val.length > 0 ? "" : "none";
}

function toggleActivityLogSort() {
    activityLogState.sortAsc = !activityLogState.sortAsc;
    const icon = document.getElementById("alSortIcon");
    if (icon) icon.innerHTML = activityLogState.sortAsc ? '<i class="fas fa-sort-up"></i>' : '<i class="fas fa-sort-down"></i>';
    applyActivityLogFilters();
}

function onActivityLogPerPageChange() {
    const sel = document.getElementById("alPerPage");
    if (sel) activityLogState.perPage = parseInt(sel.value, 10) || 10;
    activityLogState.currentPage = 1;
    renderActivityLogPage();
}

function goToActivityLogPage(page) {
    const total = Math.ceil(activityLogState.filtered.length / activityLogState.perPage);
    if (page === null) page = total;
    activityLogState.currentPage = Math.max(1, Math.min(page, total));
    renderActivityLogPage();
    document.getElementById("alTableWrap")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function prevActivityLogPage() { goToActivityLogPage(activityLogState.currentPage - 1); }
function nextActivityLogPage() { goToActivityLogPage(activityLogState.currentPage + 1); }

function toggleAlDesc(descId, btn) {
    const el = document.getElementById(descId);
    if (!el) return;
    const expanded = el.classList.toggle("al-expanded");
    btn.textContent = expanded ? "Show less" : "Show more";
}

function spinRefreshBtn(on) {
    const btn = document.getElementById("alRefreshBtn");
    if (!btn) return;
    btn.classList.toggle("al-spinning", on);
    btn.disabled = on;
}

// ── Activity Log utility functions ────────────────────────────────────────
function alToMs(ts) {
    if (!ts) return 0;
    if (typeof ts.toMillis === "function") return ts.toMillis();
    if (typeof ts.seconds === "number") return ts.seconds * 1000;
    if (ts instanceof Date) return ts.getTime();
    if (typeof ts === "number") return ts;
    return 0;
}

function alFormatTs(ts) {
    const ms = alToMs(ts);
    if (!ms) return { dateStr: "Unknown date", timeStr: "" };
    const d = new Date(ms);
    return {
        dateStr: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        timeStr: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
    };
}

function alCapFirst(str) { if (!str) return ""; return str.charAt(0).toUpperCase() + str.slice(1); }

function alRoleClass(role) {
    const r = (role || "").toLowerCase();
    if (r === "superadmin") return "al-role-superadmin";
    if (r === "admin")      return "al-role-admin";
    if (r === "teacher")    return "al-role-teacher";
    if (r === "student")    return "al-role-student";
    if (r === "school")     return "al-role-school";
    return "al-role-default";
}

function alAvatarColor(username) {
    const colors = ["background:linear-gradient(135deg,#1e40af,#3b82f6)", "background:linear-gradient(135deg,#0f766e,#14b8a6)", "background:linear-gradient(135deg,#b45309,#f59e0b)", "background:linear-gradient(135deg,#be185d,#ec4899)", "background:linear-gradient(135deg,#064e3b,#34d399)", "background:linear-gradient(135deg,#1e3a8a,#60a5fa)", "background:linear-gradient(135deg,#78350f,#fbbf24)", "background:linear-gradient(135deg,#7e22ce,#a855f7)"];
    let hash = 0;
    for (let i = 0; i < (username || "").length; i++) { hash = (hash << 5) - hash + username.charCodeAt(i); hash |= 0; }
    return colors[Math.abs(hash) % colors.length];
}

function alEsc(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}


  // =============================================
  // SCHOOLS LIST SECTION (schools-list)
  // =============================================
  let slFiltered = [];
  let slPage = 1;
  const slPageSize = 10;

  function slPopulateFilter() {
      const sel = document.getElementById('slFilterSelect');
      if (!sel) return;
      while (sel.options.length > 1) sel.remove(1);
      allSchoolDocs.forEach(function(school) {
          const opt = document.createElement('option');
          opt.value = school.docId;
          opt.textContent = school.schoolname;
          sel.appendChild(opt);
      });
  }

  function slFilterSchools() {
      const search = (document.getElementById('slSearchInput') ? document.getElementById('slSearchInput').value : '').toLowerCase();
      const filterVal = document.getElementById('slFilterSelect') ? document.getElementById('slFilterSelect').value : 'all';
      slFiltered = allSchoolDocs.filter(function(s) {
          const matchSearch = !search ||
              (s.schoolname || '').toLowerCase().includes(search) ||
              (s.schoolabbrev || '').toLowerCase().includes(search) ||
              (s.email_add || '').toLowerCase().includes(search) ||
              (s.schoolpres || '').toLowerCase().includes(search);
          const matchFilter = filterVal === 'all' || s.docId === filterVal;
          return matchSearch && matchFilter;
      });
      slPage = 1;
      slRenderTable();
  }

  function slRenderTable() {
      const tbody = document.getElementById('slTableBody');
      if (!tbody) return;
      tbody.innerHTML = '';

      const total = slFiltered.length;
      const totalPages = Math.max(1, Math.ceil(total / slPageSize));
      if (slPage > totalPages) slPage = totalPages;
      const start = (slPage - 1) * slPageSize;
      const end = Math.min(start + slPageSize, total);
      const pageData = slFiltered.slice(start, end);

      if (pageData.length === 0) {
          tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-gray);">No schools found.</td></tr>';
      } else {
          pageData.forEach(function(s, i) {
              let adminInfo = '—';
              if (typeof allAdminDocs !== 'undefined' && allAdminDocs) {
                  const abbrev = (s.schoolabbrev || '').toLowerCase();
                  const linked = allAdminDocs.find(function(a) {
                      return a.username && a.username.toLowerCase().startsWith(abbrev);
                  });
                  if (linked) adminInfo = linked.username;
              }
              const tr = document.createElement('tr');
                const _sNum = document.createElement('td'); _sNum.textContent = start + i + 1;
                const _sName = document.createElement('td'); _sName.innerHTML = '<strong>' + (s.schoolname || '—') + '</strong>';
                const _sAbbr = document.createElement('td'); _sAbbr.innerHTML = '<span style="background:var(--light-blue);color:var(--primary-blue);padding:2px 8px;border-radius:6px;font-size:0.85rem;font-weight:600;">' + (s.schoolabbrev || '—') + '</span>';
                const _sPres = document.createElement('td'); _sPres.textContent = s.schoolpres || '—';
                const _sEmail = document.createElement('td'); _sEmail.textContent = s.email_add || '—';
                const _sPhone = document.createElement('td'); _sPhone.textContent = s.contact_number || '—';
                const _sUsername = document.createElement('td'); _sUsername.textContent = s.username || '—';
                const _sAdmin = document.createElement('td'); _sAdmin.textContent = adminInfo;
                const _sAct = document.createElement('td'); _sAct.style.whiteSpace = 'nowrap';
                const _sActCell = document.createElement('div'); _sActCell.className = 'action-cell';
                const _sEdit = document.createElement('button');
                _sEdit.className = 'btn btn-secondary btn-small';
                _sEdit.title = 'Edit';
                _sEdit.innerHTML = '<i class="fas fa-edit"></i> Edit';
                _sEdit.onclick = (function(d){ return function(){ openEditSchool(d); }; })(s.docId);
                const _sDel = document.createElement('button');
                _sDel.className = 'btn btn-danger btn-small'; _sDel.title = 'Delete';
                _sDel.innerHTML = '<i class="fas fa-trash"></i> Delete';
                _sDel.onclick = (function(d,n){ return function(){ confirmDeleteSchool(d,n); }; })(s.docId, s.schoolname || '');
                _sActCell.appendChild(_sEdit); _sActCell.appendChild(_sDel); _sAct.appendChild(_sActCell);
                [_sNum,_sName,_sAbbr,_sPres,_sEmail,_sPhone,_sUsername,_sAdmin,_sAct].forEach(function(td){ tr.appendChild(td); });
                tbody.appendChild(tr);
          });
      }

      const pageInfo = document.getElementById('slPageInfo');
      const pageIndicator = document.getElementById('slPageIndicator');
      const prevBtn = document.getElementById('slPrevBtn');
      const nextBtn = document.getElementById('slNextBtn');

      if (pageInfo) pageInfo.textContent = total === 0 ? 'No records found' : 'Showing ' + (start + 1) + '-' + end + ' of ' + total + ' records';
      if (pageIndicator) pageIndicator.textContent = 'Page ' + slPage + ' of ' + totalPages;
      if (prevBtn) prevBtn.disabled = slPage <= 1;
      if (nextBtn) nextBtn.disabled = slPage >= totalPages;
  }

  function slPrevPage() { if (slPage > 1) { slPage--; slRenderTable(); } }
  function slNextPage() {
      const totalPages = Math.max(1, Math.ceil(slFiltered.length / slPageSize));
      if (slPage < totalPages) { slPage++; slRenderTable(); }
  }

  // =============================================
  // COURSES LIST SECTION (courses-list) - Firestore-based
  // =============================================
  let clAllCourses = [];
  let clFiltered = [];
  let clPage = 1;
  const clPageSize = 10;

  async function clLoadCoursesFromFirestore() {
      try {
          const snap = await db.collection('COURSE').where('deletestats', '==', 0).get();
          clAllCourses = snap.docs.map(function(doc) {
              const d = doc.data();
              return {
                  docId: doc.id,
                  courseName: d.SchoolCourse || '',
                  schoolName: d.SchoolName || '',
                  schoolAbbrev: d.SchoolAbbrev || '',
                  schoolDocId: d.School || '',
                  eduLevel: d.EducationalAttainment || ''
              };
          });
          clAllCourses.sort(function(a,b){ return a.courseName.localeCompare(b.courseName); });
          clFilterCourses();
      } catch(e) {
          console.error('clLoadCoursesFromFirestore error:', e);
      }
  }

  function clPopulateFilters() {
      const sel = document.getElementById('clSchoolFilter');
      if (!sel) return;
      while (sel.options.length > 1) sel.remove(1);
      allSchoolDocs.forEach(function(school) {
          const opt = document.createElement('option');
          opt.value = school.docId;
          opt.textContent = school.schoolname;
          sel.appendChild(opt);
      });
  }

  function clFilterCourses() {
      const search = (document.getElementById('clSearchInput') ? document.getElementById('clSearchInput').value : '').toLowerCase();
      const schoolVal = document.getElementById('clSchoolFilter') ? document.getElementById('clSchoolFilter').value : 'all';
      const eduVal = document.getElementById('clEduFilter') ? document.getElementById('clEduFilter').value : 'all';

      clFiltered = clAllCourses.filter(function(c) {
          const matchSearch = !search || c.courseName.toLowerCase().includes(search) || c.schoolName.toLowerCase().includes(search);
          const matchSchool = schoolVal === 'all' || c.schoolDocId === schoolVal;
          const matchEdu = eduVal === 'all' || c.eduLevel === eduVal;
          return matchSearch && matchSchool && matchEdu;
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
                const _cName = document.createElement('td'); _cName.innerHTML = '<strong>' + (c.courseName || '—') + '</strong>';
                const _cSchool = document.createElement('td'); _cSchool.textContent = c.schoolName || '—';
                const _cEdu = document.createElement('td'); _cEdu.innerHTML = '<span style="background:#f0f9ff;color:#0369a1;padding:2px 8px;border-radius:6px;font-size:0.82rem;font-weight:600;">' + (c.eduLevel || '—') + '</span>';
                const _cAct = document.createElement('td'); _cAct.style.whiteSpace = 'nowrap';
                const _cActCell = document.createElement('div'); _cActCell.className = 'action-cell';
                const _cEdit = document.createElement('button');
                _cEdit.className = 'btn btn-secondary btn-small';
                _cEdit.title = 'Edit';
                _cEdit.innerHTML = '<i class="fas fa-edit"></i> Edit';
                _cEdit.onclick = (function(d){ return function(){ openEditCourseFromCL(d); }; })(c.docId);
                const _cDel = document.createElement('button');
                _cDel.className = 'btn btn-danger btn-small'; _cDel.title = 'Delete';
                _cDel.innerHTML = '<i class="fas fa-trash"></i> Delete';
                _cDel.onclick = (function(d,n){ return function(){ deleteCourseFromCL(d,n); }; })(c.docId, c.courseName || '');
                _cActCell.appendChild(_cEdit); _cActCell.appendChild(_cDel); _cAct.appendChild(_cActCell);
                [_cNum,_cName,_cSchool,_cEdu,_cAct].forEach(function(td){ tr.appendChild(td); });
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
  function clNextPage() {
      const totalPages = Math.max(1, Math.ceil(clFiltered.length / clPageSize));
      if (clPage < totalPages) { clPage++; clRenderTable(); }
  }

  function openEditCourseFromCL(docId) {
      openEditCourse(docId);
  }

  async function deleteCourseFromCL(docId, courseName) {
      if (confirm('Delete course "' + courseName + '"? This cannot be undone.')) {
          try {
              await db.collection('COURSE').doc(docId).update({ deletestats: 1 });
              showToast('Course deleted successfully!', 'success');
              clAllCourses = clAllCourses.filter(function(c) { return c.docId !== docId; });
              clFilterCourses();
              filterCourseList();
              activities.unshift({ type: 'delete', title: 'Course Deleted', description: '"' + courseName + '" was deleted', time: 'Just now' });
              updateActivityLog();
              var _by = currentUser ? currentUser.username : 'SuperAdmin';
              saveActivityLog(_by + ' deleted course "' + courseName + '".', 'superadmin.html');
          } catch(e) {
              console.error('Error deleting course:', e);
              showToast('Error deleting course', 'error');
          }
      }
  }

  // School delete from Schools section
  async function confirmDeleteSchool(docId, schoolName) {
      if (confirm('Delete school "' + schoolName + '"? This cannot be undone.')) {
          try {
              await db.collection('ListofSchool').doc(docId).update({ deletestats: 1 });
              showToast(schoolName + ' deleted successfully!', 'success');
              await loadSchoolAccounts();
              updateSchoolCount();
              slFilterSchools();
              activities.unshift({ type: 'delete', title: 'School Deleted', description: schoolName + ' was deleted', time: 'Just now' });
              updateActivityLog();
              var _by = currentUser ? currentUser.username : 'SuperAdmin';
              saveActivityLog(_by + ' deleted school "' + schoolName + '".', 'superadmin.html');
          } catch(e) {
              console.error('Error deleting school:', e);
              showToast('Error deleting school', 'error');
          }
      }
  }

  // ── Shared school variables ─────────────────────────────────────────────
  let allSchoolDocs = [];
