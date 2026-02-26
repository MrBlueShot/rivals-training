// Storage key for training requests
const STORAGE_KEY = 'trainingRequests';
const ADMIN_EMAIL = 'rykersolovey@gmail.com';

// DOM Elements
const trainingForm = document.getElementById('trainingForm');
const emailInput = document.getElementById('email');
const discordInput = document.getElementById('discord');
const requestInput = document.getElementById('request');
const emailStatus = document.getElementById('emailStatus');
const discordStatus = document.getElementById('discordStatus');
const emailError = document.getElementById('emailError');
const discordError = document.getElementById('discordError');
const requestError = document.getElementById('requestError');
const charCounter = document.getElementById('charCounter');
const adminBtn = document.getElementById('adminBtn');
const formContainer = document.getElementById('formContainer');
const adminContainer = document.getElementById('adminContainer');
const requestsList = document.getElementById('requestsList');
const closeAdminBtn = document.getElementById('closeAdminBtn');
const toast = document.getElementById('toast');
const toastClose = document.getElementById('toastClose');
const totalRequestsEl = document.getElementById('totalRequests');
const requestCountEl = document.getElementById('requestCount');
const searchInput = document.getElementById('searchInput');
const refreshBtn = document.getElementById('refreshBtn');
const filterBtns = document.querySelectorAll('.filter-btn');
const modalOverlay = document.getElementById('modalOverlay');
const modalConfirm = document.getElementById('modalConfirm');
const modalCancel = document.getElementById('modalCancel');
const submitBtn = document.getElementById('submitBtn');

// State
let currentFilter = 'all';
let deleteTargetId = null;

// Particles Animation
const canvas = document.getElementById('particlesCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
let animationId;

function initParticles() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    particles = [];
    const particleCount = Math.min(50, Math.floor((canvas.width * canvas.height) / 15000));

    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            radius: Math.random() * 2 + 1,
            opacity: Math.random() * 0.5 + 0.2
        });
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((particle, i) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 59, 59, ${particle.opacity})`;
        ctx.fill();

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[j].x - particle.x;
            const dy = particles[j].y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 120) {
                ctx.beginPath();
                ctx.moveTo(particle.x, particle.y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = `rgba(255, 59, 59, ${0.15 * (1 - distance / 120)})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    });

    animationId = requestAnimationFrame(animateParticles);
}

// Initialize app
function init() {
    loadEventListeners();
    checkAdminStatus();
    updateTotalRequests();
    initParticles();
    animateParticles();
}

// Load all event listeners
function loadEventListeners() {
    trainingForm.addEventListener('submit', handleFormSubmit);
    emailInput.addEventListener('input', handleEmailInput);
    discordInput.addEventListener('input', handleDiscordInput);
    requestInput.addEventListener('input', handleRequestInput);
    adminBtn.addEventListener('click', showAdminView);
    closeAdminBtn.addEventListener('click', hideAdminView);
    toastClose.addEventListener('click', hideToast);
    searchInput.addEventListener('input', handleSearch);
    refreshBtn.addEventListener('click', handleRefresh);
    filterBtns.forEach(btn => btn.addEventListener('click', handleFilterChange));
    modalCancel.addEventListener('click', hideModal);
    modalConfirm.addEventListener('click', confirmDelete);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) hideModal();
    });

    window.addEventListener('resize', () => {
        initParticles();
    });
}

// Email input validation
function handleEmailInput() {
    const email = emailInput.value.trim();
    checkAdminStatus();

    if (email.length === 0) {
        emailStatus.className = 'input-status';
        emailStatus.textContent = '';
        emailError.classList.remove('show');
        return;
    }

    if (validateEmail(email)) {
        emailStatus.className = 'input-status valid';
        emailStatus.textContent = '✓';
        emailError.classList.remove('show');
    } else {
        emailStatus.className = 'input-status invalid';
        emailStatus.textContent = '✕';
        emailError.textContent = 'Please enter a valid email';
        emailError.classList.add('show');
    }
}

// Discord input validation
function handleDiscordInput() {
    const discord = discordInput.value.trim();

    if (discord.length === 0) {
        discordStatus.className = 'input-status';
        discordStatus.textContent = '';
        discordError.classList.remove('show');
        return;
    }

    if (discord.length >= 2) {
        discordStatus.className = 'input-status valid';
        discordStatus.textContent = '✓';
        discordError.classList.remove('show');
    } else {
        discordStatus.className = 'input-status invalid';
        discordStatus.textContent = '✕';
        discordError.textContent = 'Discord username too short';
        discordError.classList.add('show');
    }
}

// Request input handling
function handleRequestInput() {
    const text = requestInput.value;
    const length = text.length;
    const maxLength = 500;

    charCounter.textContent = `${length} / ${maxLength}`;

    if (length > maxLength) {
        requestInput.value = text.substring(0, maxLength);
        charCounter.textContent = `${maxLength} / ${maxLength}`;
        charCounter.style.color = 'var(--error)';
    } else if (length > maxLength * 0.9) {
        charCounter.style.color = 'var(--warning)';
    } else {
        charCounter.style.color = 'var(--text-tertiary)';
    }
}

// Validate email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();

    const email = emailInput.value.trim();
    const discord = discordInput.value.trim();
    const requestText = requestInput.value.trim();

    // Validation
    let hasError = false;

    if (!email || !validateEmail(email)) {
        emailError.textContent = 'Please enter a valid email';
        emailError.classList.add('show');
        hasError = true;
    } else {
        emailError.classList.remove('show');
    }

    if (!discord || discord.length < 2) {
        discordError.textContent = 'Please enter a Discord username';
        discordError.classList.add('show');
        hasError = true;
    } else {
        discordError.classList.remove('show');
    }

    if (!requestText || requestText.length < 10) {
        requestError.textContent = 'Please describe your training needs (at least 10 characters)';
        requestError.classList.add('show');
        hasError = true;
    } else {
        requestError.classList.remove('show');
    }

    if (hasError) {
        showToast('Please fix the errors before submitting', false);
        return;
    }

    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-text">Submitting...</span><span class="btn-icon">⏳</span>';

    // Simulate network delay for better UX
    setTimeout(() => {
        // Create request object
        const request = {
            id: Date.now(),
            email,
            discord,
            request: requestText,
            timestamp: new Date().toISOString()
        };

        // Save to storage
        saveRequest(request);

        // Show success toast
        showToast('Request Submitted Successfully!', true);

        // Clear form
        trainingForm.reset();
        emailStatus.className = 'input-status';
        discordStatus.className = 'input-status';
        charCounter.textContent = '0 / 500';
        charCounter.style.color = 'var(--text-tertiary)';

        // Update total requests
        updateTotalRequests();

        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="btn-text">Submit Request</span><span class="btn-icon">→</span>';

        // If admin, update admin view if visible
        if (!adminContainer.classList.contains('hidden')) {
            displayRequests();
        }
    }, 800);
}

// Save request to localStorage
function saveRequest(request) {
    let requests = getRequests();
    requests.push(request);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

// Get all requests from localStorage
function getRequests() {
    const requests = localStorage.getItem(STORAGE_KEY);
    return requests ? JSON.parse(requests) : [];
}

// Delete request
function deleteRequest(id) {
    let requests = getRequests();
    requests = requests.filter(req => req.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    displayRequests();
    updateTotalRequests();
    showToast('Request deleted successfully', true);
}

// Check if current email is admin
function checkAdminStatus() {
    const email = emailInput.value.trim();
    if (email === ADMIN_EMAIL) {
        adminBtn.classList.remove('hidden');
    } else {
        adminBtn.classList.add('hidden');
    }
}

// Show admin view
function showAdminView() {
    formContainer.classList.add('hidden');
    adminContainer.classList.remove('hidden');
    displayRequests();
}

// Hide admin view
function hideAdminView() {
    adminContainer.classList.add('hidden');
    formContainer.classList.remove('hidden');
    searchInput.value = '';
    currentFilter = 'all';
    filterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === 'all');
    });
}

// Handle search
function handleSearch() {
    displayRequests();
}

// Handle refresh
function handleRefresh() {
    displayRequests();
    showToast('Requests refreshed', true);
}

// Handle filter change
function handleFilterChange(e) {
    const filter = e.target.dataset.filter;
    currentFilter = filter;

    filterBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');

    displayRequests();
}

// Filter requests by time
function filterRequestsByTime(requests) {
    const now = new Date();

    switch (currentFilter) {
        case 'today':
            return requests.filter(req => {
                const reqDate = new Date(req.timestamp);
                return reqDate.toDateString() === now.toDateString();
            });
        case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return requests.filter(req => new Date(req.timestamp) >= weekAgo);
        default:
            return requests;
    }
}

// Display all requests in admin view
function displayRequests() {
    let requests = getRequests();
    const searchTerm = searchInput.value.toLowerCase();

    // Apply time filter
    requests = filterRequestsByTime(requests);

    // Apply search filter
    if (searchTerm) {
        requests = requests.filter(req =>
            req.email.toLowerCase().includes(searchTerm) ||
            req.discord.toLowerCase().includes(searchTerm) ||
            req.request.toLowerCase().includes(searchTerm)
        );
    }

    requestsList.innerHTML = '';
    requestCountEl.textContent = `${requests.length} Request${requests.length !== 1 ? 's' : ''}`;

    if (requests.length === 0) {
        requestsList.innerHTML = `
            <div class="empty-state">
                <p>No training requests found</p>
            </div>
        `;
        return;
    }

    // Sort by timestamp (newest first)
    requests.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    requests.forEach((request, index) => {
        const card = createRequestCard(request, index);
        requestsList.appendChild(card);
    });
}

// Create request card element
function createRequestCard(request, index) {
    const card = document.createElement('div');
    card.className = 'request-card';
    card.style.animationDelay = `${index * 0.05}s`;

    const date = new Date(request.timestamp);
    const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    card.innerHTML = `
        <div class="request-header">
            <div class="request-meta">
                <div class="request-email">${escapeHtml(request.email)}</div>
                <div class="request-discord">${escapeHtml(request.discord)}</div>
                <div class="request-date">${formattedDate}</div>
            </div>
            <div class="request-actions">
                <button class="action-btn" onclick="handleDeleteRequest(${request.id})" title="Delete">🗑️</button>
            </div>
        </div>
        <div class="request-text">${escapeHtml(request.request)}</div>
    `;

    return card;
}

// Handle delete request
window.handleDeleteRequest = function(id) {
    deleteTargetId = id;
    showModal();
};

// Show modal
function showModal() {
    modalOverlay.classList.remove('hidden');
    setTimeout(() => modalOverlay.classList.add('show'), 10);
}

// Hide modal
function hideModal() {
    modalOverlay.classList.remove('show');
    setTimeout(() => {
        modalOverlay.classList.add('hidden');
        deleteTargetId = null;
    }, 400);
}

// Confirm delete
function confirmDelete() {
    if (deleteTargetId) {
        deleteRequest(deleteTargetId);
        hideModal();
    }
}

// Update total requests counter
function updateTotalRequests() {
    const requests = getRequests();
    totalRequestsEl.textContent = requests.length;

    // Animate counter
    totalRequestsEl.style.transform = 'scale(1.3)';
    setTimeout(() => {
        totalRequestsEl.style.transform = 'scale(1)';
    }, 300);
}

// Show toast notification
function showToast(message, isSuccess) {
    const toastTitle = document.querySelector('.toast-title');
    const toastMessage = document.querySelector('.toast-message');
    const toastIcon = document.querySelector('.toast-icon');

    toastTitle.textContent = isSuccess ? 'Success!' : 'Error';
    toastMessage.textContent = message;
    toastIcon.textContent = isSuccess ? '✓' : '✕';

    toast.classList.add('show');

    setTimeout(() => {
        hideToast();
    }, 4000);
}

// Hide toast
function hideToast() {
    toast.classList.remove('show');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add smooth input animations
function addInputAnimations() {
    const inputs = document.querySelectorAll('.input-field, .textarea-field');

    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.parentElement.style.transform = 'translateY(-2px)';
        });

        input.addEventListener('blur', function() {
            this.parentElement.parentElement.style.transform = 'translateY(0)';
        });
    });
}

// Initialize on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Add input animations
addInputAnimations();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
});
