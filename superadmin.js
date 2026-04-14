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
                // Clear form
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
        let yearWindowStart = 2020; // decade start as calendar year integer (e.g., 2020 = show 2020-2021 ... 2029-2030)
        let currentFilter = 'enrollees';
        let currentSchool = 'all';
        let currentEducationalLevel = 'all';

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
            // Hide all sections
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });

            // Show selected section
            document.getElementById(sectionId).classList.add('active');

            // Update sidebar menu
            document.querySelectorAll('.sidebar-menu a').forEach(link => {
                link.classList.remove('active');
            });
            event.target.classList.add('active');


             // ADD THIS BLOCK:
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
            if (confirm('Are you sure you want to logout?')) {
                var _logoutUser = currentUser ? currentUser.username : 'SuperAdmin';
                saveActivityLog(_logoutUser + ' logged out.', 'superadmin.html').finally(function() {
                    window.location.href = 'index.html';
                });
            }
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
        function filterBySchool() {
            const schoolFilter = document.getElementById('schoolFilter');
            currentSchool = schoolFilter.value;
            
            const sectionTitle = document.querySelector('#school-data .section-title');
            if (currentSchool === 'all') {
                sectionTitle.innerHTML = '<i class="fas fa-chart-bar"></i> School Data Analytics - All Schools';
            } else {
                const schoolName = schoolFilter.options[schoolFilter.selectedIndex].text;
                sectionTitle.innerHTML = `<i class="fas fa-chart-bar"></i> School Data Analytics - ${schoolName}`;
            }
            
            loadCoursesFromFirestore();
            
            // Setup real-time listener with new filters
            setupDataAnalyticsListener();
            
            // Load data from Firestore
            loadDataFromFirestoreAndUpdate();

            
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

        function filterByEducationalAttainment() {
            const educationalFilter = document.getElementById('educationalFilter');
            currentEducationalLevel = educationalFilter.value;
            
            const sectionTitle = document.querySelector('#school-data .section-title');
            const schoolFilter = document.getElementById('schoolFilter');
            const schoolName = currentSchool === 'all' ? 'All Schools' : schoolFilter.options[schoolFilter.selectedIndex].text;
            const educationalName = educationalFilter.options[educationalFilter.selectedIndex].text;
            
            sectionTitle.innerHTML = `<i class="fas fa-chart-bar"></i> School Data Analytics - ${schoolName} | ${educationalName}`;
            
            loadCoursesFromFirestore();
            
            // Setup real-time listener with new filters
            setupDataAnalyticsListener();
            
            // Load data from Firestore
            loadDataFromFirestoreAndUpdate();
            
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

        function filterByCategory() {
            const categoryFilter = document.getElementById('categoryFilter');
            currentFilter = categoryFilter.value;
            
            // Setup real-time listener with new filters
            setupDataAnalyticsListener();
            
            // Load data from Firestore
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
        // yearWindowStart is a calendar year integer (e.g., 2020)
        // getVisibleYears() returns ['2020-2021', '2021-2022', ..., '2029-2030']
        function getCurrentAcademicYear() {
            var now = new Date();
            var y = now.getFullYear();
            var m = now.getMonth(); // 0-indexed
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
            var realYear = new Date().getFullYear(); // e.g., 2026
            yearWindowStart = Math.floor(realYear / 10) * 10; // e.g., 2020
        }

        function yearNavPrev() {
            yearWindowStart -= YEAR_WINDOW_SIZE; // go back one decade
            renderYearNavigator();
            updateUnifiedTableHeaders();
            updateUnifiedTable();
        }

        function yearNavNext() {
            yearWindowStart += YEAR_WINDOW_SIZE; // go forward one decade
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
            
            // Clear existing year headers
            const existingHeaders = mainHeaderRow.querySelectorAll('th:not(:first-child)');
            existingHeaders.forEach(header => header.remove());
            
            const existingSubHeaders = subHeaderRow.querySelectorAll('th');
            existingSubHeaders.forEach(header => header.remove());
            
            // Add year headers and subheaders for visible window only
            const visibleYears = getVisibleYears();
            visibleYears.forEach((year) => {
                // Main year header (spans 3 columns: Male, Female, Total)
                const yearHeader = document.createElement('th');
                yearHeader.className = 'year-header' + (year === getCurrentAcademicYear() ? ' year-header-current' : '');
                yearHeader.colSpan = 3;
                yearHeader.textContent = year;
                mainHeaderRow.appendChild(yearHeader);
                
                // Gender subheaders
                const maleHeader = document.createElement('th');
                maleHeader.className = 'gender-subheader male-header';
                maleHeader.textContent = 'MALE';
                subHeaderRow.appendChild(maleHeader);
                
                const femaleHeader = document.createElement('th');
                femaleHeader.className = 'gender-subheader female-header';
                femaleHeader.textContent = 'FEMALE';
                subHeaderRow.appendChild(femaleHeader);
                
                const totalHeader = document.createElement('th');
                totalHeader.className = 'gender-subheader total-header';
                totalHeader.textContent = 'TOTAL';
                subHeaderRow.appendChild(totalHeader);
            });
        }

   function updateUnifiedTable() {
    const tableBody = document.getElementById('unifiedTableBody');
    if (!schoolsData[currentSchool]) { tableBody.innerHTML = ''; return; }
    const data = schoolsData[currentSchool][currentFilter];
    if (!data) { tableBody.innerHTML = ''; return; }

            
            tableBody.innerHTML = '';
            

var coursesToShow;
if (currentEducationalLevel === 'all' && currentSchool === 'all') {
    coursesToShow = Object.keys(data);
} else {
    var eduMap = {
        'bachelor': 'BACHELOR DEGREE',
        'twoyear': '2-YEAR COURSE',
        'tesda': 'TESDA',
        'graduate': 'GRADUATE COURSE'
    };
    var targetEduLabel = eduMap[currentEducationalLevel];

    var filtered = courseList.filter(function(c) {
        var matchSchool = currentSchool === 'all' || c.school === currentSchool;
        var matchEdu = currentEducationalLevel === 'all' || c.eduLevel === targetEduLabel;
        return matchSchool && matchEdu;
    });
    coursesToShow = filtered.map(function(c) { return c.name; }).filter(function(name) { return data && data[name]; });
}

            
            coursesToShow.forEach((course) => {
                if (data[course]) {
                    const row = document.createElement('tr');
                    row.className = 'course-row';
                    
                    let rowHTML = `
                        <td>
                            <input type="checkbox" class="course-checkbox" data-course="${course}">
                            <span class="course-name">${course}</span>
                        </td>
                    `;
                    
                    const visibleYearsForTable = getVisibleYears();
                    visibleYearsForTable.forEach((year) => {
                        const realYearIndex = academicYears.indexOf(year);
                        const genderData = realYearIndex !== -1 ? data[course][realYearIndex] : null;
                        const maleValue = (genderData && typeof genderData === 'object') ? (genderData.male || 0) : 0;
                        const femaleValue = (genderData && typeof genderData === 'object') ? (genderData.female || 0) : 0;
                        const totalValue = maleValue + femaleValue;
                        
                        rowHTML += `
                            <td class="gender-data-cell male">
                                <input type="number" class="editable-input" value="${maleValue}" 
                                       onchange="updateGenderData('${course}', ${realYearIndex}, 'male', this.value)" min="0">
                            </td>
                            <td class="gender-data-cell female">
                                <input type="number" class="editable-input" value="${femaleValue}" 
                                       onchange="updateGenderData('${course}', ${realYearIndex}, 'female', this.value)" min="0">
                            </td>
                            <td class="gender-data-cell total">
                                ${totalValue}
                            </td>
                        `;
                    });
                    
                    row.innerHTML = rowHTML;
                    tableBody.appendChild(row);
                }
            });
        }

        function updateGenderData(course, yearIndex, gender, value) {
            const newValue = parseInt(value) || 0;
            
            if (!schoolsData[currentSchool][currentFilter][course][yearIndex]) {
                schoolsData[currentSchool][currentFilter][course][yearIndex] = {male: 0, female: 0};
            }
            
            schoolsData[currentSchool][currentFilter][course][yearIndex][gender] = newValue;
            
            // Update the total column
            const row = event.target.closest('tr');
            const totalCells = row.querySelectorAll('.total');
            const yearCells = row.querySelectorAll('.gender-data-cell');
            
            // Find which year this belongs to and update its total
            const cellIndex = Array.from(row.cells).indexOf(event.target.closest('td'));
            const yearGroupIndex = Math.floor((cellIndex - 1) / 3);
            const totalCellIndex = yearGroupIndex * 3 + 3; // +3 because total is the third in each group
            
            if (row.cells[totalCellIndex]) {
                const maleVal = parseInt(row.cells[totalCellIndex - 2].querySelector('input').value) || 0;
                const femaleVal = parseInt(row.cells[totalCellIndex - 1].querySelector('input').value) || 0;
                row.cells[totalCellIndex].textContent = maleVal + femaleVal;
            }
            
            updateSummary();
            
            // Add highlight effect
            row.classList.add('highlight');
            setTimeout(() => {
                row.classList.remove('highlight');
            }, 1000);
        }

        function updateSummary() {
            const data = schoolsData[currentSchool][currentFilter];
            let totals = new Array(academicYears.length).fill(0);
            
            const educationalMappings = {
                'all': Object.keys(data),
                'undergraduate': Object.keys(data).filter(course => 
                    course.startsWith('Bachelor of Science') || 
                    course.startsWith('Bachelor of Arts')
                ),
                'certificate': Object.keys(data).filter(course => 
                    course.includes('major in')
                ),
                'vocational': Object.keys(data).filter(course => 
                    course.includes('Engineering Technology') || 
                    course.includes('Railway Engineering')
                )
            };

            const coursesToInclude = educationalMappings[currentEducationalLevel] || Object.keys(data);
            
            coursesToInclude.forEach(course => {
                if (data[course]) {
                    data[course].forEach((genderData, index) => {
                        if (index < totals.length) {
                            const numVal = (genderData && typeof genderData === 'object') ? 
                                ((genderData.male || 0) + (genderData.female || 0)) : (genderData || 0);
                            totals[index] += numVal;
                        }
                    });
                }
            });
            
            const totalSum = totals.reduce((sum, val) => sum + val, 0);
            
            switch(currentFilter) {
                case 'enrollees':
                    document.getElementById('totalEnrollees').textContent = totalSum.toLocaleString();
                    break;
                case 'outside':
                    document.getElementById('totalOutside').textContent = totalSum.toLocaleString();
                    break;
                case 'inside':
                    document.getElementById('totalInside').textContent = totalSum.toLocaleString();
                    break;
                case 'graduates':
                    document.getElementById('totalGraduates').textContent = totalSum.toLocaleString();
                    break;
                case 'passers':
                    document.getElementById('totalPassers').textContent = totalSum.toLocaleString();
                    break;
            }
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

            // Use getVisibleYears() so we always export the full 10-year window
            var exportYears = getVisibleYears();

            function colToLetter(n) {
                var s = '';
                while (n > 0) { n--; s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26); }
                return s;
            }

            // Row A: year headers (colspan 3 each), Row B: Male/Female/Total per year
            // Total cols = 1 (course name) + 3 * numYears
            var totalCols = 1 + exportYears.length * 3;
            var lastCol = colToLetter(totalCols);

            var colMaxLen = new Array(totalCols).fill(10);
            colMaxLen[0] = Math.max(colMaxLen[0], ('School: ' + schoolLabel).length + 2);

            // Collect data rows from the DOM (only visible rows)
            var dataRows = [];
            document.querySelectorAll('#unifiedTableBody tr').forEach(function(row) {
                if (row.style.display === 'none') return;
                var dr = [];
                var cnEl = row.querySelector('.course-name');
                var cn = cnEl ? cnEl.textContent.trim() : '';
                dr.push(cn);
                colMaxLen[0] = Math.max(colMaxLen[0], cn.length + 2);

                // For each export year, find cell data
                exportYears.forEach(function(year, yi) {
                    var realYearIndex = academicYears.indexOf(year);
                    // Cells in DOM correspond to visible years, not export years
                    // Use academicYears index to get data from schoolsData
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

            var workbook = new ExcelJS.Workbook();
            var ws = workbook.addWorksheet('Student Data');

            // Row 1: Title
            ws.addRow(['Utown Data Name']);
            ws.mergeCells('A1:' + lastCol + '1');
            var r1 = ws.getCell('A1');
            r1.font = { bold: true, size: 16 };
            r1.alignment = { horizontal: 'center', vertical: 'middle' };

            // Row 2: Info labels
            ws.addRow([]);
            ws.getCell('A2').value = 'School: ' + schoolLabel;
            ws.mergeCells('A2:B2');
            ws.getCell('A2').font = { bold: true, size: 14 };
            ws.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };

            ws.getCell('H2').value = 'Education Attainment: ' + eduLabel;
            ws.mergeCells('H2:J2');
            ws.getCell('H2').font = { bold: true, size: 14 };
            ws.getCell('H2').alignment = { horizontal: 'center', vertical: 'middle' };

            var catStartCol = colToLetter(14);
            ws.getCell(catStartCol + '2').value = 'Category: ' + catLabel;
            ws.mergeCells(catStartCol + '2:' + lastCol + '2');
            ws.getCell(catStartCol + '2').font = { bold: true, size: 14 };
            ws.getCell(catStartCol + '2').alignment = { horizontal: 'center', vertical: 'middle' };

            // Row A (row 3): Course Name (rowspan=2) + year headers (each merged colspan 3)
            var rowAValues = ['Course Name'];
            exportYears.forEach(function(year) {
                rowAValues.push(year, '', '');
            });
            var rowAObj = ws.addRow(rowAValues);
            // Style course name cell
            var courseNameCell = ws.getCell('A3');
            courseNameCell.font = { bold: true, size: 13 };
            courseNameCell.alignment = { horizontal: 'center', vertical: 'middle' };
            ws.mergeCells('A3:A4');

            // Merge each year group (3 cols) and style
            exportYears.forEach(function(year, yi) {
                var startCol = 2 + yi * 3;
                var endCol = startCol + 2;
                var startLetter = colToLetter(startCol);
                var endLetter = colToLetter(endCol);
                ws.mergeCells(startLetter + '3:' + endLetter + '3');
                var yearCell = ws.getCell(startLetter + '3');
                yearCell.value = year;
                yearCell.font = { bold: true, size: 13 };
                yearCell.alignment = { horizontal: 'center', vertical: 'middle' };
            });

            // Row B (row 4): Male/Female/Total subheaders per year
            var rowBValues = [''];
            exportYears.forEach(function() {
                rowBValues.push('MALE', 'FEMALE', 'TOTAL');
            });
            var rowBObj = ws.addRow(rowBValues);
            rowBObj.eachCell(function(cell, colNum) {
                if (colNum === 1) return;
                cell.font = { bold: true, size: 12 };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            });

            // Data rows starting at row 5
            dataRows.forEach(function(dr) { ws.addRow(dr); });

            // Apply borders and background fills to all cells
            var headerBg = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
            var subheaderBg = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
            var evenRowBg = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5FB' } };
            var oddRowBg = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
            var thinBorder = { style: 'thin', color: { argb: 'FFBFDBFE' } };
            var thinBorderDark = { style: 'thin', color: { argb: 'FF93C5FD' } };
            ws.eachRow(function(row, rowNumber) {
                row.eachCell({ includeEmpty: true }, function(cell) {
                    cell.border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };
                    if (rowNumber === 1) {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
                        cell.font = Object.assign({}, cell.font || {}, { bold: true, color: { argb: 'FFFFFFFF' }, size: 16 });
                    } else if (rowNumber === 2) {
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
            updateUnifiedTable();
            updateSummary();
            
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
            
            // Check if category is N/A before saving
            if (currentFilter === 'enrollees' && document.getElementById('categoryFilter').value === 'enrollees') {
                showToast('Please choose a category before saving.', 'error');
                return;
            }
            
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            saveBtn.disabled = true;
            
            // Save all current data to Firebase
            saveAllDataToFirebase().then(() => {
                saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
                showToast('All data saved successfully!', 'success');
                
                activities.unshift({
                    type: 'edit',
                    title: 'Data Saved',
                    description: 'All school data changes have been saved successfully',
                    time: 'Just now'
                });
                updateActivityLog();
                
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
                // Check if category is N/A
                if (currentFilter === 'enrollees' && document.getElementById('categoryFilter').value === 'enrollees') {
                    throw new Error('Please choose a category before saving.');
                }
                
                const data = schoolsData[currentSchool][currentFilter];
                const savePromises = [];
                
                // Map category filter to Firebase category
                const categoryMap = {
                    'enrollees': 'N/A',
                    'outside': 'OutsideBataan',
                    'inside': 'InsideBataan',
                    'graduates': 'Graduates', 
                    'passers': 'NumberofBoardPasser',
                };
                
                // Get the actual selected category from the dropdown
                const categorySelect = document.getElementById('categoryFilter');
                const selectedCategory = categorySelect ? categorySelect.value : currentFilter;
                const category = categoryMap[selectedCategory] || 'N/A';
                
                // Iterate through all courses and years
                Object.keys(data).forEach(courseName => {
                    data[courseName].forEach((genderData, yearIndex) => {
                        const year = academicYears[yearIndex];
                        if (!year) return;
                        
                        // Get educational attainment for this course
                        const courseInfo = courseList.find(c => c.name === courseName);
                        let educationalAttainment = 'N/A';
                        
                        if (courseInfo && courseInfo.eduLevel) {
                            educationalAttainment = courseInfo.eduLevel;
                        } else {
                            const eduMap = {
                                'bachelor': 'BACHELOR DEGREE',
                                'twoyear': '2-YEAR COURSE',
                                'tesda': 'TESDA', 
                                'graduate': 'GRADUATE COURSE'
                            };
                            educationalAttainment = eduMap[currentEducationalLevel] || 'N/A';
                        }
                        
                        const maleValue = (genderData && typeof genderData === 'object') ? (genderData.male || 0) : 0;
                        const femaleValue = (genderData && typeof genderData === 'object') ? (genderData.female || 0) : 0;
                        
                        // Only save if there's actual data
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

        // ─── Firestore ActivityLog writer ───────────────────────────────────
        async function getNextActivityLogId() {
            try {
                const snap = await db.collection('ActivityLog').get();
                let max = 0;
                snap.forEach(function(doc) {
                    const match = doc.id.match(/^ActivityID_(\d+)$/);
                    if (match) max = Math.max(max, parseInt(match[1]));
                });
                return 'ActivityID_' + String(max + 1).padStart(4, '0');
            } catch(e) { return 'ActivityID_' + Date.now(); }
        }

        async function saveActivityLog(description, location) {
            try {
                const actId = await getNextActivityLogId();
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
            // FEATURE 3: Update nav site name
            if (settings.SystemName) {
                var navEl = document.getElementById('navSiteName');
                if (navEl) navEl.textContent = settings.SystemName;
                document.title = 'Super Admin Dashboard - ' + settings.SystemName;
            }
            // FEATURE 4: Update Contact Us email
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
            var today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
            var lastBackupDate = localStorage.getItem('utownLastBackupDate');
            if (lastBackupDate === today) return; // already ran today
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
            var monthKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
            var lastMonth = localStorage.getItem('utownLastBackupMonth');
            if (lastMonth === monthKey) return;
            await runFirebaseBackup();
            localStorage.setItem('utownLastBackupMonth', monthKey);
        }

        // Recursively converts Firestore-specific types (Timestamp, GeoPoint, etc.)
        // into plain JSON-safe values BEFORE JSON.stringify is called.
        // This is necessary because Firestore Timestamp has a toJSON() method that
        // fires before the JSON.stringify replacer, turning it into {seconds,nanoseconds}
        // so the replacer never sees the original Timestamp object.
        function sanitizeFirestoreData(val) {
            if (val === null || val === undefined) return val;
            // Firestore Timestamp: has toDate()
            if (typeof val === 'object' && typeof val.toDate === 'function') {
                return val.toDate().toISOString();
            }
            // Plain object that looks like a serialized Timestamp {seconds, nanoseconds}
            if (typeof val === 'object' && !Array.isArray(val) &&
                typeof val.seconds === 'number' && typeof val.nanoseconds === 'number' &&
                Object.keys(val).length === 2) {
                return new Date(val.seconds * 1000).toISOString();
            }
            // Firestore GeoPoint: has latitude/longitude
            if (typeof val === 'object' && typeof val.latitude === 'number' && typeof val.longitude === 'number') {
                return { latitude: val.latitude, longitude: val.longitude };
            }
            // Array
            if (Array.isArray(val)) {
                return val.map(sanitizeFirestoreData);
            }
            // Plain object
            if (typeof val === 'object') {
                var out = {};
                Object.keys(val).forEach(function(k) { out[k] = sanitizeFirestoreData(val[k]); });
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
                            // sanitize before storing so JSON.stringify has no Firestore types
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
        let dataAnalyticsListener = null;
        let friendlyIdCounter = 0;

        // Initialize friendly ID counter
        async function initializeFriendlyIdCounter() {
            try {
                const snapshot = await db.collection('Data_Analytics').get();
                let maxId = 0;
                snapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.Friendly_ID && typeof data.Friendly_ID === 'number') {
                        maxId = Math.max(maxId, data.Friendly_ID);
                    }
                });
                friendlyIdCounter = maxId;
            } catch (error) {
                console.error('Error initializing friendly ID counter:', error);
                friendlyIdCounter = 0;
            }
        }

        // Get next friendly ID
        function getNextFriendlyId() {
            friendlyIdCounter++;
            return friendlyIdCounter;
        }

        // Convert school name to abbreviation for document ID
        function getSchoolAbbreviation(schoolId) {
            const school = allSchoolDocs.find(s => s.docId === schoolId);
            return school ? school.schoolabbrev : 'UNKNOWN';
        }

        // Convert course name to abbreviation
        function getCourseAbbreviation(courseName) {
            // Create abbreviation from course name
            const words = courseName.split(' ');
            if (words.length === 1) {
                return courseName.substring(0, 4).toUpperCase();
            }
            return words.map(word => word.charAt(0).toUpperCase()).join('').substring(0, 6);
        }

        // Save data to Firestore Data_Analytics
        async function saveToDataAnalytics(schoolId, year, courseName, category, maleCount, femaleCount, educationalAttainment) {
            try {
                const schoolAbbrev = getSchoolAbbreviation(schoolId);
                const courseAbbrev = getCourseAbbreviation(courseName);
                
                // Create document ID: SchoolAbbrev_Year_CourseAbbrev_Category
                const docId = `${schoolAbbrev}_${year}_${courseAbbrev}_${category}`;
                
                // Check if document already exists
                const existingDoc = await db.collection('Data_Analytics').doc(docId).get();
                
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

                if (existingDoc.exists) {
                    // Update existing document
                    await db.collection('Data_Analytics').doc(docId).update(dataToSave);
                } else {
                    // Create new document with Firestore Auto-ID for SCHOOL_YEAR_CourseCountID
                    const autoIdDoc = await db.collection('Data_Analytics').add({});
                    const autoId = autoIdDoc.id;
                    
                    // Delete the auto-created document and use our custom ID
                    await autoIdDoc.delete();
                    
                    // Add Firestore Auto-ID and Friendly_ID to data
                    dataToSave.SCHOOL_YEAR_CourseCountID = autoId;
                    dataToSave.Friendly_ID = getNextFriendlyId();
                    
                    // Save with custom document ID
                    await db.collection('Data_Analytics').doc(docId).set(dataToSave);
                }
                
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
                
                // Get educational attainment for this course
                const courseInfo = courseList.find(c => c.name === courseName);
                const educationalAttainment = courseInfo ? courseInfo.eduLevel : 'BACHELOR DEGREE';
                
                // Get current male and female values
                const currentData = schoolsData[currentSchool][currentFilter][courseName][yearIndex];
                const maleCount = currentData ? currentData.male : 0;
                const femaleCount = currentData ? currentData.female : 0;
                
                // Map category filter to Firebase category
                const categoryMap = {
                    'enrollees': 'N/A',
                    'outside': 'OutsideBataan',
                    'inside': 'InsideBataan',
                    'graduates': 'Graduates',
                    'passers': 'NumberofBoardPasser'
                };
                
                // Get the actual selected category from the dropdown
                const categorySelect = document.getElementById('categoryFilter');
                const selectedCategory = categorySelect ? categorySelect.value : currentFilter;
                const firebaseCategory = categoryMap[selectedCategory] || 'N/A';
                
                // Save to Firebase
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
                    female: femaleCount
                });
                
            } catch (error) {
                console.error('Error saving gender data to Firebase:', error);
                showToast('Error saving data to database', 'error');
            }
        }
        // Load data from Firestore Data_Analytics
        async function loadDataFromFirestore(schoolId, educationalAttainment, category) {
            try {
                let query = db.collection('Data_Analytics');
                
                // Apply filters
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

        // Setup real-time listener for Data_Analytics
        function setupDataAnalyticsListener() {
            if (dataAnalyticsListener) {
                dataAnalyticsListener();
            }
            
            let query = db.collection('Data_Analytics');
            
            // Apply current filters
            if (currentSchool && currentSchool !== 'all') {
                query = query.where('SchoolID', '==', currentSchool);
            }
            if (currentEducationalLevel && currentEducationalLevel !== 'all') {
                const eduMap = {
                    'bachelor': 'BACHELOR DEGREE',
                    'twoyear': '2-YEAR COURSE',
                    'tesda': 'TESDA',
                    'graduate': 'GRADUATE COURSE'
                };
                const targetEdu = eduMap[currentEducationalLevel];
                if (targetEdu) {
                    query = query.where('EDUCATIONAL_ATTAINMENT', '==', targetEdu);
                }
            }
            if (currentFilter && currentFilter !== 'all') {
                const categoryMap = {
                    'enrollees': 'N/A',
                    'outside': 'OutsideBataan', 
                    'inside': 'InsideBataan',
                    'graduates': 'Graduates',
                    'passers': 'NumberofBoardPasser'
                };
                const targetCategory = categoryMap[currentFilter];
                if (targetCategory) {
                    query = query.where('CATEGORY', '==', targetCategory);
                }
            }
            
            dataAnalyticsListener = query.onSnapshot(snapshot => {
                console.log('Real-time update received from Firestore');
                updateTableFromFirestoreSnapshot(snapshot);
            }, error => {
                console.error('Error in real-time listener:', error);
            });
        }

        // Update table from Firestore snapshot
        function updateTableFromFirestoreSnapshot(snapshot) {
            const targetKey = currentSchool || 'all';
            const targetCategory = currentFilter || 'enrollees';
            
            // Initialize data structure if needed
            if (!schoolsData[targetKey]) {
                schoolsData[targetKey] = { enrollees:{}, outside:{}, inside:{}, graduates:{}, passers:{} };
            }
            if (!schoolsData[targetKey][targetCategory]) {
                schoolsData[targetKey][targetCategory] = {};
            }
            
            // Clear existing data for this filter combination
            const existingCourses = Object.keys(schoolsData[targetKey][targetCategory]);
            existingCourses.forEach(course => {
                schoolsData[targetKey][targetCategory][course] = new Array(academicYears.length).fill(0).map(() => ({male:0, female:0}));
            });
            
            // Process snapshot data
            snapshot.forEach(doc => {
                const data = doc.data();
                const courseName = data.COURSE;
                const year = data.YEAR;
                const male = data.MALE || 0;
                const female = data.FEMALE || 0;
                
                // Find year index
                const yearIndex = academicYears.indexOf(year);
                if (yearIndex === -1) return;
                
                // Initialize course data if needed
                if (!schoolsData[targetKey][targetCategory][courseName]) {
                    schoolsData[targetKey][targetCategory][courseName] = new Array(academicYears.length).fill(0).map(() => ({male:0, female:0}));
                }
                
                // Update data
                schoolsData[targetKey][targetCategory][courseName][yearIndex] = { male, female };
            });
            
            // Sort courses alphabetically
            const sortedCourses = Object.keys(schoolsData[targetKey][targetCategory]).sort();
            const sortedData = {};
            sortedCourses.forEach(course => {
                sortedData[course] = schoolsData[targetKey][targetCategory][course];
            });
            schoolsData[targetKey][targetCategory] = sortedData;
            
            // Update UI
            updateUnifiedTable();
            updateSummary();
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
            var snap = await db.collection('SuperAdminAccount').where('deletestats', '==', 0).get();
            for (var i = 0; i < snap.docs.length; i++) {
                var d = snap.docs[i].data();
                if (d.fname.toLowerCase() === fname.toLowerCase() && d.lname.toLowerCase() === lname.toLowerCase()) { showToast('Account Already Exist', 'error'); return; }
                if (d.username.toLowerCase() === username.toLowerCase()) { showToast('Username Already Exist', 'error'); return; }
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
            await loadAdminAccounts();
            activities.unshift({ type: 'add', title: 'New Admin Account Added', description: username + ' was added as an admin account', time: 'Just now' });
            updateActivityLog();
            var _adminAddedBy = currentUser ? currentUser.username : 'SuperAdmin';
            saveActivityLog(_adminAddedBy + ' added admin account "' + username + '".', 'superadmin.html');
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
                var btn = el.parentNode.querySelector('.password-eye-btn i');
                if (btn) { btn.className = 'fas fa-eye'; }
            } else {
                el.textContent = plainText;
                el.setAttribute('data-show', '1');
                var btn = el.parentNode.querySelector('.password-eye-btn i');
                if (btn) { btn.className = 'fas fa-eye-slash'; }
            }
        }

        function togglePasswordById(elId) {
            var el = document.getElementById(elId);
            if (!el) return;
            togglePasswordDisplay(elId, el.getAttribute('data-pw') || '');
        }

        async function deleteAdminAccount(docId) {
            var snap = await db.collection('SuperAdminAccount').doc(docId).get();
            var d = snap.data();
            await db.collection('SuperAdminAccount').doc(docId).update({ deletestats: 1 });
            showToast('Admin account deleted.', 'success');
            await loadAdminAccounts();
            activities.unshift({ type: 'delete', title: 'Admin Account Deleted', description: (d ? d.username : docId) + ' was removed from the system', time: 'Just now' });
            updateActivityLog();
            var _by = currentUser ? currentUser.username : 'SuperAdmin';
            saveActivityLog(_by + ' deleted admin account "' + (d ? d.username : docId) + '".', 'superadmin.html');
        }

        async function openEditAdmin(docId) {
            var snap = await db.collection('SuperAdminAccount').doc(docId).get();
            var d = snap.data();
            document.getElementById('editAdminDocId').value       = docId;
            document.getElementById('editAdminFirstName').value   = d.fname;
            document.getElementById('editAdminLastName').value    = d.lname;
            document.getElementById('editAdminBirthday').value    = d.bday;
            document.getElementById('editAdminAddress').value     = d.address;
            document.getElementById('editAdminUsername').value    = d.username;
            document.getElementById('editAdminPassword').value    = d.password;
            document.getElementById('editAdminModal').style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }

        function closeEditAdminModal() {
            document.getElementById('editAdminModal').style.display = 'none';
            document.body.style.overflow = 'auto';
        }

        async function saveEditAdmin() {
            var docId    = document.getElementById('editAdminDocId').value;
            var fname    = document.getElementById('editAdminFirstName').value.trim();
            var lname    = document.getElementById('editAdminLastName').value.trim();
            var bday     = document.getElementById('editAdminBirthday').value;
            var address  = document.getElementById('editAdminAddress').value.trim();
            var username = document.getElementById('editAdminUsername').value.trim();
            var password = document.getElementById('editAdminPassword').value;
            var snap = await db.collection('SuperAdminAccount').where('deletestats', '==', 0).get();
            for (var i = 0; i < snap.docs.length; i++) {
                if (snap.docs[i].id === docId) continue;
                var d = snap.docs[i].data();
                if (d.fname.toLowerCase() === fname.toLowerCase() && d.lname.toLowerCase() === lname.toLowerCase()) { showToast('Account Already Exist', 'error'); return; }
                if (d.username.toLowerCase() === username.toLowerCase()) { showToast('Username Already Exist', 'error'); return; }
            }
            await db.collection('SuperAdminAccount').doc(docId).update({ fname: fname, lname: lname, bday: bday, address: address, username: username, password: password });
            showToast(fname + ' ' + lname + ' updated successfully.', 'success');
            closeEditAdminModal();
            await loadAdminAccounts();
            var _by = currentUser ? currentUser.username : 'SuperAdmin';
            saveActivityLog(_by + ' edited admin account "' + username + '".', 'superadmin.html');
        }

        async function loadAdminAccounts() {
            try {
                var snap = await db.collection('SuperAdminAccount').where('deletestats', '==', 0).get();
                allAdminDocs = [];
                snap.forEach(function(doc) { allAdminDocs.push(Object.assign({ docId: doc.id }, doc.data())); });
                allAdminDocs.sort(function(a, b) { return (b.timestamp && a.timestamp) ? b.timestamp.seconds - a.timestamp.seconds : 0; });
                adminPage = 1;
                renderAdminTable();
            } catch(e) { console.error('loadAdminAccounts error:', e); }
        }

        function adminSearchFilter(query) {
            adminSearchQuery = query;
            adminPage = 1;
            renderAdminTable();
        }

        function renderAdminTable() {
            var tableBody = document.getElementById('adminAccountsTableBody');
            if (!tableBody) return;
            tableBody.innerHTML = '';
            var q = adminSearchQuery.toLowerCase();
            adminFilteredDocs = q ? allAdminDocs.filter(function(a) {
                return (a.fname + ' ' + a.lname).toLowerCase().includes(q) ||
                       a.username.toLowerCase().includes(q) ||
                       (a.address || '').toLowerCase().includes(q);
            }) : allAdminDocs;
            var total      = adminFilteredDocs.length;
            var totalPages = Math.max(1, Math.ceil(total / adminPageSize));
            if (adminPage > totalPages) adminPage = totalPages;
            var start    = (adminPage - 1) * adminPageSize;
            var end      = Math.min(start + adminPageSize, total);
            var pageData = adminFilteredDocs.slice(start, end);
            pageData.forEach(function(admin, idx) {
                var row = document.createElement('tr');
                var safeId = admin.docId.replace(/'/g, "\\'");
                var pwId = 'admin-pw-' + safeId.replace(/[^a-zA-Z0-9]/g,'_');
                var fullName = admin.fname + ' ' + admin.lname;
                row.innerHTML =
                    '<td>' + (start + idx + 1) + '</td>' +
                    '<td><strong>' + fullName + '</strong></td>' +
                    '<td>' + admin.bday + '</td>' +
                    '<td>' + admin.address + '</td>' +
                    '<td>' + admin.username + '</td>' +
                    '<td><div class="password-wrap"><div class="password-display" id="' + pwId + '" data-show="0" data-pw="">\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022</div><button class="password-eye-btn" onclick="togglePasswordById(\'' + pwId + '\')" title="Show/Hide Password"><i class=\"fas fa-eye\"></i></button></div></td>' +
                    '<td><div class="action-cell">' +
                        '<button class="btn btn-secondary btn-small" onclick="openEditAdmin(\'' + safeId + '\')" title="Edit"><i class=\"fas fa-edit\"></i> Edit</button>' +
                        '<button class="btn btn-danger btn-small" title="Delete"><i class=\"fas fa-trash\"></i> Delete</button>' +
                    '</div></td>';
                // store data safely after innerHTML
                var pwElem = row.querySelector('#' + pwId);
                if (pwElem) pwElem.setAttribute('data-pw', admin.password || '');
                // store name for delete confirm
                row.setAttribute('data-name', fullName);
                // fix confirmDeleteAdmin to read name from row
                var delBtn = row.querySelector('.btn-danger');
                if (delBtn) delBtn.addEventListener('click', (function(did, nm){ return function(){ confirmDeleteAdmin(did, nm); }; })(safeId, fullName));
                tableBody.appendChild(row);
            });
            var pageInfo      = document.getElementById('adminPageInfo');
            var pageIndicator = document.getElementById('adminPageIndicator');
            var prevBtn       = document.getElementById('adminPrevBtn');
            var nextBtn       = document.getElementById('adminNextBtn');
            if (pageInfo)      pageInfo.textContent      = total === 0 ? 'No records yet' : 'Showing ' + (start+1) + '-' + end + ' of ' + total + ' records';
            if (pageIndicator) pageIndicator.textContent = 'Page ' + adminPage + ' of ' + totalPages;
            if (prevBtn)       prevBtn.disabled           = adminPage <= 1;
            if (nextBtn)       nextBtn.disabled           = adminPage >= totalPages;
        }

        function adminPrevPage() {
            if (adminPage > 1) { adminPage--; renderAdminTable(); }
        }

        function adminNextPage() {
            var totalPages = Math.max(1, Math.ceil(adminFilteredDocs.length / adminPageSize));
            if (adminPage < totalPages) { adminPage++; renderAdminTable(); }
        }

        // ── School Management (Firestore) ─────────────────────────────────────
        let schoolCredPage = 1;
        const schoolCredPageSize = 5;
        let schoolCredFiltered = [];
        let allSchoolDocs = [];

        async function getNextSchoolId(abbrev) {
            var snap = await db.collection('ListofSchool').get();
            var max = 0;
            snap.forEach(function(doc) {
                var m = doc.id.match(/^SchoolId_(\d+)_/);
                if (m) max = Math.max(max, parseInt(m[1]));
            });
            var safeAbbrev = abbrev.replace(/[^a-zA-Z0-9]/g, '');
            return 'SchoolId_' + String(max + 1).padStart(4, '0') + '_' + safeAbbrev;
        }

async function addSchool(event) {
    event.preventDefault();

    const phone = document.getElementById('schoolPhone').value;
    if (!validatePhoneNumber(phone)) {
        showToast('Contact number must be 11 digits and follow the format 09##-###-####', 'error');
        document.getElementById('schoolPhone').focus();
        return;
    }

    var schoolname = document.getElementById('schoolName').value.trim();
    var schoolabbrev = document.getElementById('schoolAbbreviation').value.trim();
    var schoolpres = document.getElementById('schoolPresident').value.trim();
    var address = document.getElementById('schoolAddress').value.trim();
    
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

    var snap = await db.collection('ListofSchool').where('deletestats', '==', 0).get();
    for (var i = 0; i < snap.docs.length; i++) {
        var d = snap.docs[i].data();
        if (d.schoolname.toLowerCase() === schoolname.toLowerCase()) { 
            showToast('School Already Exist', 'error'); 
            return; 
        }
        if (d.schoolabbrev.toLowerCase() === schoolabbrev.toLowerCase()) { 
            showToast('School Abbreviation Already Exist', 'error'); 
            return; 
        }
        if (d.username && d.username.toLowerCase() === username.toLowerCase()) { 
            showToast('Username Already Exist', 'error'); 
            return; 
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

// Load courses from Firestore based on current school + edu level filter
async function loadCoursesFromFirestore() {
    if (currentSchool === 'all' || currentEducationalLevel === 'all') {
        courseList = courseList.filter(function(c) {
            return c._persisted !== true;
        });
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
            
            // Initialize Firestore integration
            initializeFriendlyIdCounter();
            
            updateActivityLog();
            initYearWindowStart();
            renderYearNavigator();
            updateUnifiedTableHeaders();
            updateUnifiedTable();
            updateSummary();
            initCourseListFromData();
            
            // Load admin accounts and schools on page load
            loadAdminAccounts();
            loadSchoolAccounts().then(function() {
                slFiltered = allSchoolDocs.slice();
                // Setup initial real-time listener
                setupDataAnalyticsListener();
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

        // Helper function to load data from Firestore and update UI
        async function loadDataFromFirestoreAndUpdate() {
            try {
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
                
                updateUnifiedTable();
                updateSummary();
            } catch (error) {
                console.error('Error loading data from Firestore:', error);
            }
        }

        // Cleanup listener when page unloads
        window.addEventListener('beforeunload', function() {
            if (dataAnalyticsListener) {
                dataAnalyticsListener();
            }
        });

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
                const activeModal = document.querySelector('.modal[style*="block"]');
                
                if (activeModal) {
                    activeModal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
            }
        });


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
        pills.push({ label: `School: ${school ? school.schoolname : state.filterSchool}`, clear: () => { state.filterSchool = ""; document.getElementById("alSchoolFilter").value = ""; applyActivityLogFilters(); } });
    }
    if (state.filterRole) pills.push({ label: `Role: ${alCapFirst(state.filterRole)}`, clear: () => { state.filterRole = ""; document.getElementById("alRoleFilter").value = ""; applyActivityLogFilters(); } });
    if (!pills.length) { container.style.display = "none"; return; }
    container.style.display = "flex";
    container.innerHTML = "";
    pills.forEach(pill => {
        const span = document.createElement("span");
        span.className = "al-pill";
        span.innerHTML = `${alEsc(pill.label)} <button class="al-pill-remove" title="Remove"><i class="fas fa-times"></i></button>`;
        span.querySelector("button").addEventListener("click", pill.clear);
        container.appendChild(span);
    });
}

function updateAlFilterStyles() {
    const state = activityLogState;
    [["alUsernameFilter", state.filterUsername], ["alSchoolFilter", state.filterSchool], ["alRoleFilter", state.filterRole]].forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (!el) return;
        val ? el.classList.add("al-filter-active") : el.classList.remove("al-filter-active");
    });
}

function showActivityLogState(state, message) {
    ["alLoading","alError","alEmpty","alTableWrap"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });
    const statsRow = document.getElementById("alStatsRow");
    const pag = document.getElementById("alPagination");
    if (statsRow) statsRow.style.display = (state === "table" || state === "empty") ? "flex" : "none";
    if (pag) pag.style.display = "none";
    const map = { loading: "alLoading", error: "alError", empty: "alEmpty", table: "alTableWrap" };
    const target = document.getElementById(map[state]);
    if (target) target.style.display = state === "table" ? "block" : "flex";
    if (state === "error") {
        const msg = document.getElementById("alErrorMsg");
        if (msg) msg.textContent = message || "Failed to load activity logs.";
    }
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
    ["alUsernameFilter","alSchoolFilter","alRoleFilter"].forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
    alToggleClear();
    applyActivityLogFilters();
}

function alToggleClear() {
    const val = (document.getElementById("alSearchInput")?.value || "").trim();
    const btn = document.getElementById("alSearchClear");
    if (btn) btn.classList.toggle("al-visible", val.length > 0);
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
    return "al-role-default";
}

function alAvatarColor(username) {
    const colors = [
        "background:linear-gradient(135deg,#1e40af,#3b82f6)",
        "background:linear-gradient(135deg,#0f766e,#14b8a6)",
        "background:linear-gradient(135deg,#b45309,#f59e0b)",
        "background:linear-gradient(135deg,#be185d,#ec4899)",
        "background:linear-gradient(135deg,#064e3b,#34d399)",
        "background:linear-gradient(135deg,#1e3a8a,#60a5fa)",
        "background:linear-gradient(135deg,#78350f,#fbbf24)",
        "background:linear-gradient(135deg,#7e22ce,#a855f7)",
    ];
    let hash = 0;
    for (let i = 0; i < (username || "").length; i++) { hash = (hash << 5) - hash + username.charCodeAt(i); hash |= 0; }
    return colors[Math.abs(hash) % colors.length];
}

function alEsc(str) {
    if (!str) return "";
    return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
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
                const _sEdit = document.createElement('button');
                _sEdit.className = 'btn btn-secondary btn-small';
                _sEdit.title = 'Edit'; _sEdit.style.marginRight = '4px';
                _sEdit.innerHTML = '<i class="fas fa-edit"></i> Edit';
                _sEdit.onclick = (function(d){ return function(){ openEditSchool(d); }; })(s.docId);
                const _sDel = document.createElement('button');
                _sDel.className = 'btn btn-danger btn-small'; _sDel.title = 'Delete';
                _sDel.innerHTML = '<i class="fas fa-trash"></i> Delete';
                _sDel.onclick = (function(d,n){ return function(){ confirmDeleteSchool(d,n); }; })(s.docId, s.schoolname || '');
                _sAct.appendChild(_sEdit); _sAct.appendChild(_sDel);
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
                const _cEdit = document.createElement('button');
                _cEdit.className = 'btn btn-secondary btn-small';
                _cEdit.title = 'Edit'; _cEdit.style.marginRight = '4px';
                _cEdit.innerHTML = '<i class="fas fa-edit"></i> Edit';
                _cEdit.onclick = (function(d){ return function(){ openEditCourseFromCL(d); }; })(c.docId);
                const _cDel = document.createElement('button');
                _cDel.className = 'btn btn-danger btn-small'; _cDel.title = 'Delete';
                _cDel.innerHTML = '<i class="fas fa-trash"></i> Delete';
                _cDel.onclick = (function(d,n){ return function(){ deleteCourseFromCL(d,n); }; })(c.docId, c.courseName || '');
                _cAct.appendChild(_cEdit); _cAct.appendChild(_cDel);
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