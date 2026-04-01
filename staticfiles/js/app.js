/**
 * Gia Phả Việt Nam - Main Application
 * Family Relationship Management System
 */

// ============================================
// State Management
// ============================================
const state = {
    currentTab: 'tong-quan',
    lastScrollY: 0,
    spouseCount: 1
};

// ============================================
// Constants
// ============================================
const SPOUSE_LABELS = ['Chính thất', 'Kế thất', 'Thứ thất'];
const SPOUSE_COLORS = ['#fcd34d', '#d97706', '#b45309', '#92400e', '#78350f'];

const ROLE_DATA = {
    'thuy-to': {
        title: 'Thủy Tổ (Ông Tổ)',
        desc: 'Người đầu tiên của dòng họ mà con cháu xác định được danh tính. Mọi thế hệ sau đều tính từ cụ Thủy Tổ (Đời thứ 1). Trong gia phả, trang đầu tiên và trang trọng nhất luôn dành cho Thủy Tổ.'
    },
    'truong-toc': {
        title: 'Trưởng Tộc (Trưởng Họ)',
        desc: 'Người con trai trưởng của dòng trưởng (Đích tôn thừa trọng). Có trách nhiệm giữ gia phả gốc, giữ hương hỏa, chủ trì việc tế lễ của cả họ.'
    },
    'truong-chi': {
        title: 'Trưởng Chi / Trưởng Ngành',
        desc: 'Người đứng đầu một nhánh (Chi). Thường là con trai thứ của ông Tổ. Trưởng chi chịu trách nhiệm cúng giỗ trong phạm vi chi của mình.'
    },
    'dich-ton': {
        title: 'Cháu Đích Tôn',
        desc: 'Cháu trai trưởng của dòng trưởng. Người sẽ kế thừa vị trí Trưởng Tộc trong tương lai.'
    },
    'thu-nam': {
        title: 'Con Thứ / Cháu Thứ',
        desc: 'Các con trai không phải con trưởng. Sau này con cháu của họ sẽ phát triển thành các Chi, Phái, Cành, Nhánh mới.'
    },
    'nganh-thu': {
        title: 'Ngành Thứ (Chi Thứ)',
        desc: 'Các nhánh được tách ra từ con thứ của các đời trước.'
    },
    'chau-chi': {
        title: 'Cháu Trưởng (Của Chi)',
        desc: 'Người kế thừa hương hỏa của một Chi cụ thể.'
    },
    'chau-thu': {
        title: 'Cháu Thứ',
        desc: 'Thành viên trong họ, có trách nhiệm đóng góp giỗ chạp, tu sửa mộ phần.'
    }
};

// ============================================
// Navigation & Tab Switching
// ============================================
function switchTab(tabId) {
    state.currentTab = tabId;

    // Update tab content visibility
    document.querySelectorAll('.tab-content').forEach(el => {
        el.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');

    // Update nav button styles
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-[#fef3c7]', 'font-bold', 'text-[#78350f]');
        if (btn.dataset.tab === tabId) {
            btn.classList.add('bg-[#fef3c7]', 'font-bold', 'text-[#78350f]');
        }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// Scroll Detection for Collapsible Menu
// ============================================
function initScrollDetection() {
    const nav = document.querySelector('nav');
    const scrollThreshold = 80;

    window.addEventListener('scroll', function () {
        const currentScrollY = window.scrollY;

        if (currentScrollY > scrollThreshold) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }

        state.lastScrollY = currentScrollY;
    }, { passive: true });
}

// ============================================
// Tree Interaction
// ============================================
function showRole(roleKey) {
    const info = ROLE_DATA[roleKey];
    const titleEl = document.getElementById('role-title');
    const descEl = document.getElementById('role-desc');
    const panel = document.getElementById('role-info');

    if (info) {
        titleEl.textContent = info.title;
        descEl.textContent = info.desc;
        panel.classList.remove('bg-[#fffbeb]');
        void panel.offsetWidth; // trigger reflow
        panel.classList.add('bg-[#fffbeb]');
    }
}

// ============================================
// Dynamic Spouse Management
// ============================================
function addSpouse() {
    state.spouseCount++;
    const container = document.getElementById('spousesContainer');
    const label = state.spouseCount <= 3 ? SPOUSE_LABELS[state.spouseCount - 1] : `Kế thất ${state.spouseCount - 1}`;
    const color = SPOUSE_COLORS[Math.min(state.spouseCount - 1, SPOUSE_COLORS.length - 1)];

    const spouseDiv = document.createElement('div');
    spouseDiv.className = 'spouse-entry border-l-4 pl-3 mb-3';
    spouseDiv.style.borderColor = color;
    spouseDiv.dataset.spouse = state.spouseCount;
    spouseDiv.innerHTML = `
        <div class="flex items-center justify-between gap-2 mb-1">
            <span class="text-xs font-semibold" style="color: ${color}">${label}:</span>
            <button type="button" onclick="removeSpouse(this)" class="text-xs text-red-500 hover:text-red-700">✕ Xóa</button>
        </div>
        <input type="text" class="spouse-name mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="VD: Bà Trần Thị Lan, quê xã...">
        <input type="text" class="spouse-children mt-2 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm" placeholder="Con: VD: 1 trai (Vũ Văn D)">
    `;
    container.appendChild(spouseDiv);
}

function removeSpouse(btn) {
    const spouseDiv = btn.closest('.spouse-entry');
    if (spouseDiv && spouseDiv.dataset.spouse !== '1') {
        spouseDiv.remove();
    }
}

// ============================================
// Lunar Calendar Conversion
// ============================================
function convertToLunar() {
    const solarDate = document.getElementById('inputDeathSolar').value;
    if (!solarDate) return;

    const [year, month, day] = solarDate.split('-').map(Number);
    const lunar = window.LunarCalendar.solarToLunar(day, month, year);

    document.getElementById('inputDeathLunar').value = window.LunarCalendar.formatLunarDate(lunar);
}

// ============================================
// Biography Generator
// ============================================
function generateBiography(e) {
    e.preventDefault();

    const name = document.getElementById('inputName').value || '...';
    const rank = document.getElementById('inputRank').value;
    const birth = document.getElementById('inputBirth').value || '...';
    const deathLunar = document.getElementById('inputDeathLunar').value;
    const alias = document.getElementById('inputAlias').value;
    const thuy = document.getElementById('inputThuy').value;
    const hanhtrang = document.getElementById('inputHanhtrang').value;
    const grave = document.getElementById('inputGrave').value;

    // Collect all spouses
    const spouseEntries = document.querySelectorAll('.spouse-entry');
    const spouses = [];
    spouseEntries.forEach((entry, index) => {
        const spouseName = entry.querySelector('.spouse-name').value;
        const children = entry.querySelector('.spouse-children').value;
        if (spouseName) {
            spouses.push({
                label: index === 0 ? 'Chính thất' : (index <= 2 ? SPOUSE_LABELS[index] : `Kế thất ${index}`),
                name: spouseName,
                children: children
            });
        }
    });

    // Build biography
    let bio = `<p class="mb-2"><strong class="text-xl">${name.toUpperCase()}</strong>`;

    if (alias) bio += ` (Tên tự: ${alias})`;
    if (thuy) bio += ` — Thụy: <em>${thuy}</em>`;
    bio += `.</p>`;

    bio += `<p>Ông là <strong>${rank}</strong>, sinh năm ${birth}. `;

    if (deathLunar) {
        bio += `Mất ngày <strong>${deathLunar}</strong> (tức ngày Kỵ nhật). Hưởng thọ... tuổi. `;
        if (grave) bio += `Mộ phần an táng tại: ${grave}. `;
    } else {
        bio += `Hiện vẫn đang sinh sống cùng con cháu. `;
    }
    bio += `</p>`;

    if (hanhtrang) {
        bio += `<p class="mt-2 text-sm"><em>Hành trạng: ${hanhtrang}</em></p>`;
    }

    if (spouses.length > 0) {
        bio += `<div class="mt-3 border-t border-[#d6d3d1] pt-2">`;
        spouses.forEach((spouse, idx) => {
            const color = idx === 0 ? '#92400e' : '#b45309';
            bio += `<p class="mt-2"><strong style="color:${color}">● ${spouse.label}:</strong> Cụ bà ${spouse.name}.`;
            if (spouse.children) {
                bio += ` Sinh hạ được: ${spouse.children}.`;
            }
            bio += `</p>`;
        });
        bio += `</div>`;
    } else {
        bio += `<p class="mt-2">Sinh hạ được ... con trai (nam tử) và ... con gái (nữ tử). Gồm: ...</p>`;
    }

    document.getElementById('outputContent').innerHTML = bio;
}

// ============================================
// Chart Initialization
// ============================================
function initChart() {
    const ctx = document.getElementById('componentsChart');
    if (!ctx) return;

    new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Phả Ký (Lịch sử)', 'Phả Hệ (Danh sách)', 'Phả Đồ (Sơ đồ)', 'Tộc Ước & Khác'],
            datasets: [{
                data: [20, 60, 10, 10],
                backgroundColor: ['#92400e', '#b45309', '#d97706', '#fcd34d'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { family: "'Noto Sans VN', sans-serif", size: 11 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => context.label + ': ' + context.parsed + '%'
                    }
                }
            }
        }
    });
}

// ============================================
// Include Partials (Simple implementation)
// ============================================
async function includePartials() {
    const includes = document.querySelectorAll('[data-include]');
    for (const el of includes) {
        try {
            const response = await fetch(el.dataset.include);
            if (response.ok) {
                el.innerHTML = await response.text();
            }
        } catch (e) {
            console.error('Failed to load partial:', el.dataset.include);
        }
    }
}

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', async function () {
    await includePartials();
    initScrollDetection();
    initChart();
});

// Export functions for global access
window.switchTab = switchTab;
window.showRole = showRole;
window.addSpouse = addSpouse;
window.removeSpouse = removeSpouse;
window.convertToLunar = convertToLunar;
window.generateBiography = generateBiography;
