// Configuration
const API_URL = 'https://matia-rag-production.up.railway.app';

// State
let state = {
    conversations: [],
    activeConversationId: null,
    store: { name: null, loading: false },
    files: [],
    isProcessing: false
};

// DOM Elements
const els = {
    sidebar: document.getElementById('sidebar'),
    toggleSidebarBtn: document.getElementById('toggleSidebar-btn') || document.getElementById('toggle-sidebar-btn'),
    newChatBtn: document.getElementById('new-chat-btn'),
    conversationList: document.getElementById('conversation-list'),
    
    emptyState: document.getElementById('empty-state'),
    messagesWrapper: document.getElementById('messages-wrapper'),
    chatContainer: document.getElementById('chat-container'),
    chatInput: document.getElementById('chat-input'),
    sendBtn: document.getElementById('send-btn'),
    loadingIndicator: document.getElementById('loading-indicator'),
    
    // Modal
    modalOverlay: document.getElementById('modal-overlay'),
    openStoreBtn: document.getElementById('open-store-btn'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    storeBadge: document.getElementById('store-badge'),
    storeActions: document.getElementById('store-actions'),
    createStoreBtn: document.getElementById('create-store-btn'),
    storeActiveActions: document.getElementById('store-active-actions'),
    storeNameDisplay: document.getElementById('store-name-display'),
    deleteStoreBtn: document.getElementById('delete-store-btn'),
    uploadSection: document.getElementById('upload-section'),
    fileInput: document.getElementById('file-upload-input'),
    fileList: document.getElementById('file-list'),
    fileCount: document.getElementById('file-count'),
    refreshFilesBtn: document.getElementById('refresh-files-btn'),

    // Snippet Modal
    snippetModalOverlay: document.getElementById('snippet-modal-overlay'),
    closeSnippetBtn: document.getElementById('close-snippet-btn'),
    snippetModalTitle: document.getElementById('snippet-modal-title'),
    snippetModalBody: document.getElementById('snippet-modal-body')
};

// ==========================================
// API Handlers
// ==========================================
const api = {
    async get(endpoint) {
        const res = await fetch(`${API_URL}${endpoint}`);
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
    },
    async post(endpoint, body = null, isJson = true) {
        const options = { method: 'POST' };
        if (body) {
            if (isJson) {
                options.headers = { 'Content-Type': 'application/json' };
                options.body = JSON.stringify(body);
            } else {
                options.body = body; // FormData
            }
        }
        const res = await fetch(`${API_URL}${endpoint}`, options);
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
    },
    async delete(endpoint) {
        const res = await fetch(`${API_URL}${endpoint}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
    }
};

// ==========================================
// Initialization
// ==========================================
async function init() {
    setupEventListeners();
    await fetchConversations();
    checkStoreStatus();
}

// ==========================================
// Event Listeners
// ==========================================
function setupEventListeners() {
    // Sidebar
    els.toggleSidebarBtn.addEventListener('click', () => {
        els.sidebar.classList.toggle('collapsed');
    });
    els.newChatBtn.addEventListener('click', startNewChat);
    
    // Chat Input
    els.chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight < 200 ? this.scrollHeight : 200) + 'px';
        els.sendBtn.disabled = this.value.trim() === '' || state.isProcessing;
    });
    
    els.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    els.sendBtn.addEventListener('click', sendMessage);
    
    // Modal
    els.openStoreBtn.addEventListener('click', openModal);
    els.closeModalBtn.addEventListener('click', closeModal);
    els.modalOverlay.addEventListener('click', (e) => {
        if (e.target === els.modalOverlay) closeModal();
    });
    
    // Store Actions
    els.createStoreBtn.addEventListener('click', createStore);
    els.deleteStoreBtn.addEventListener('click', deleteStore);
    els.refreshFilesBtn.addEventListener('click', fetchFiles);
    
    // File Upload
    els.fileInput.addEventListener('change', uploadFile);

    // Citations
    els.messagesWrapper.addEventListener('click', (e) => {
        const pill = e.target.closest('.citation-pill');
        if (pill) {
            const source = pill.getAttribute('data-source');
            const snippet = decodeURIComponent(pill.getAttribute('data-snippet'));
            openSnippetModal(source, snippet);
        }
    });
    
    // Snippet Modal
    els.closeSnippetBtn.addEventListener('click', closeSnippetModal);
    els.snippetModalOverlay.addEventListener('click', (e) => {
        if (e.target === els.snippetModalOverlay) closeSnippetModal();
    });
}

// ==========================================
// Conversation Logic
// ==========================================
async function fetchConversations() {
    try {
        const data = await api.get('/api/conversations');
        state.conversations = data || [];
        renderConversations();
    } catch (e) {
        console.error("Failed to fetch conversations", e);
    }
}

function renderConversations() {
    els.conversationList.innerHTML = '';
    state.conversations.forEach((conv, index) => {
        const div = document.createElement('div');
        div.className = `conv-item ${state.activeConversationId === conv.id ? 'active' : ''}`;
        div.style.animationDelay = `${index * 0.05}s`;
        
        div.innerHTML = `
            <span><i class="ph ph-chat-circle mr-2"></i> ${conv.title || 'New Conversation'}</span>
            <button class="delete-conv-btn icon-btn" title="Delete">
                <i class="ph ph-trash"></i>
            </button>
        `;
        
        // Select logic
        div.addEventListener('click', (e) => {
            if (!e.target.closest('.delete-conv-btn')) {
                loadConversation(conv.id);
            }
        });
        
        // Delete logic
        const deleteBtn = div.querySelector('.delete-conv-btn');
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm("Delete this conversation?")) {
                await api.delete(`/api/conversations/${conv.id}`);
                if (state.activeConversationId === conv.id) startNewChat();
                fetchConversations();
            }
        });
        
        els.conversationList.appendChild(div);
    });
}

function startNewChat() {
    state.activeConversationId = null;
    els.messagesWrapper.innerHTML = '';
    els.emptyState.classList.add('active');
    renderConversations();
}

async function loadConversation(id) {
    state.activeConversationId = id;
    els.emptyState.classList.remove('active');
    els.messagesWrapper.innerHTML = '';
    renderConversations();
    
    try {
        const messages = await api.get(`/api/conversations/${id}/messages`);
        messages.forEach(msg => appendMessageToUI(msg));
        scrollToBottom();
    } catch (e) {
        console.error("Failed to load messages", e);
    }
}

// ==========================================
// Chat Logic
// ==========================================
async function sendMessage() {
    const text = els.chatInput.value.trim();
    if (!text || state.isProcessing) return;
    
    // Reset input
    els.chatInput.value = '';
    els.chatInput.style.height = 'auto';
    els.sendBtn.disabled = true;
    
    // Hide empty state
    els.emptyState.classList.remove('active');
    
    // Optimistic UI update
    appendMessageToUI({ role: 'user', content: text });
    scrollToBottom();
    
    state.isProcessing = true;
    els.loadingIndicator.classList.remove('hidden');
    scrollToBottom();
    
    try {
        const res = await api.post('/api/chat', { 
            message: text, 
            conversation_id: state.activeConversationId 
        });
        
        if (!state.activeConversationId && res.conversation_id) {
            state.activeConversationId = res.conversation_id;
            fetchConversations();
        }
        
        appendMessageToUI({ 
            role: 'model', 
            content: res.response, 
            citations: res.citations 
        });
    } catch (e) {
        appendMessageToUI({ role: 'model', content: "**Error:** Could not connect to backend." });
    } finally {
        state.isProcessing = false;
        els.loadingIndicator.classList.add('hidden');
        scrollToBottom();
    }
}

function appendMessageToUI(msg) {
    const div = document.createElement('div');
    div.className = `message ${msg.role === 'user' ? 'user' : 'ai'}`;
    
    const avatarIcon = msg.role === 'user' ? '<i class="ph ph-user"></i>' : '<i class="ph ph-robot"></i>';
    
    // Parse markdown for AI responses
    let contentHtml = msg.role === 'model' ? marked.parse(msg.content) : `<p>${msg.content}</p>`;
    
    // Add citations if present
    let citationsHtml = '';
    if (msg.citations && msg.citations.length > 0) {
        const pills = msg.citations.map(c => {
            const encodedSnippet = encodeURIComponent(c.snippet);
            return `<div class="citation-pill" data-source="${c.source || 'Doc'}" data-snippet="${encodedSnippet}">
                <i class="ph ph-file-text"></i> ${c.source || 'Doc'}
            </div>`;
        }).join('');
        citationsHtml = `<div class="citations">${pills}</div>`;
    }
    
    div.innerHTML = `
        <div class="avatar">${avatarIcon}</div>
        <div class="message-content">
            ${contentHtml}
            ${citationsHtml}
        </div>
    `;
    
    els.messagesWrapper.appendChild(div);
}

function scrollToBottom() {
    els.chatContainer.scrollTop = els.chatContainer.scrollHeight;
}

// ==========================================
// Knowledge Store Logic
// ==========================================
function openModal() {
    els.modalOverlay.classList.remove('hidden');
    checkStoreStatus();
    fetchFiles();
}

function closeModal() {
    els.modalOverlay.classList.add('hidden');
}

async function checkStoreStatus() {
    els.storeBadge.className = 'badge checking';
    els.storeBadge.textContent = 'Checking...';
    els.storeActions.classList.add('hidden');
    els.storeActiveActions.classList.add('hidden');
    els.uploadSection.classList.add('hidden');
    
    try {
        const res = await api.get('/api/store');
        state.store.name = res.name;
        
        if (res.name) {
            els.storeBadge.className = 'badge active';
            els.storeBadge.textContent = 'Active';
            els.storeActiveActions.classList.remove('hidden');
            els.storeNameDisplay.textContent = res.name;
            els.uploadSection.classList.remove('hidden');
        } else {
            els.storeBadge.className = 'badge checking';
            els.storeBadge.textContent = 'None';
            els.storeActions.classList.remove('hidden');
        }
    } catch (e) {
        els.storeBadge.textContent = 'Error';
    }
}

async function createStore() {
    const btn = els.createStoreBtn;
    const ogText = btn.textContent;
    btn.textContent = 'Creating...';
    btn.disabled = true;
    
    try {
        await api.post('/api/store');
        await checkStoreStatus();
    } catch (e) {
        alert("Failed to create store.");
    } finally {
        btn.textContent = ogText;
        btn.disabled = false;
    }
}

async function deleteStore() {
    if (!confirm("Delete entire vector store? This cannot be undone.")) return;
    try {
        await api.delete('/api/store');
        await checkStoreStatus();
        fetchFiles();
    } catch (e) {
        alert("Failed to delete store.");
    }
}

async function fetchFiles() {
    try {
        const res = await api.get('/api/files');
        state.files = res.documents || res.files || [];
        renderFiles();
    } catch (e) {
        console.error("Failed to fetch files", e);
    }
}

function renderFiles() {
    els.fileCount.textContent = state.files.length;
    els.fileList.innerHTML = '';
    
    if (state.files.length === 0) {
        els.fileList.innerHTML = '<div class="empty-files">No documents uploaded.</div>';
        return;
    }
    
    state.files.forEach((f, index) => {
        const div = document.createElement('div');
        div.className = 'file-item';
        div.style.animationDelay = `${index * 0.05}s`;
        
        const displayName = f.displayName || f.name?.split('/').pop() || f.name;
        const fileId = f.name?.split('/').pop() || f.name;

        div.innerHTML = `
            <div class="file-name"><i class="ph ph-file mr-2 text-secondary"></i> ${displayName}</div>
            <button class="icon-btn delete-file-btn small"><i class="ph ph-trash"></i></button>
        `;

        div.querySelector('.delete-file-btn').addEventListener('click', async () => {
            if (confirm(`Delete ${displayName}?`)) {
                await api.delete(`/api/files/${fileId}`);
                fetchFiles();
            }
        });
        
        els.fileList.appendChild(div);
    });
}

async function uploadFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    const label = els.uploadSection.querySelector('label span');
    const ogText = label.textContent;
    label.textContent = 'Uploading...';
    
    try {
        await api.post('/api/upload', formData, false);
        await fetchFiles();
    } catch (err) {
        alert("Upload failed.");
    } finally {
        label.textContent = ogText;
        els.fileInput.value = '';
    }
}

// ==========================================
// Snippet Modal Logic
// ==========================================
function openSnippetModal(source, snippet) {
    els.snippetModalTitle.innerHTML = `<i class="ph ph-file-text"></i> ${source}`;
    els.snippetModalBody.innerHTML = marked.parse(snippet);
    els.snippetModalOverlay.classList.remove('hidden');
}

function closeSnippetModal() {
    els.snippetModalOverlay.classList.add('hidden');
}

// Start
document.addEventListener('DOMContentLoaded', init);
