// Minimalist Notepad Application
class MinimalistNotepad {
    constructor() {
        this.documents = [];
        this.activeDocumentId = 1;
        this.documentCounter = 1;
        this.settings = {
            theme: 'light',
            typewriterSounds: false,
            autoSave: true,
            focusMode: false,
            typewriterMode: false,
            fontSize: 16,
            lineHeight: 1.5
        };
        
        this.searchIndex = -1;
        this.searchResults = [];
        this.autoSaveTimer = null;
        this.initialized = false;
        
        this.init();
    }
    
    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeApp());
        } else {
            this.initializeApp();
        }
    }
    
    initializeApp() {
        this.loadSettings();
        this.loadDocuments();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.applyTheme();
        this.updatePreview();
        this.setupAutoSave();
        this.applyInitialModes();
        this.initialized = true;
        
        // Initialize marked.js options
        if (window.marked) {
            marked.setOptions({
                breaks: true,
                gfm: true,
                highlight: function(code, lang) {
                    if (window.Prism && lang && Prism.languages[lang]) {
                        return Prism.highlight(code, Prism.languages[lang], lang);
                    }
                    return code;
                }
            });
        }
    }
    
    loadSettings() {
        const saved = localStorage.getItem('notepad-settings');
        if (saved) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            } catch (e) {
                console.error('Error loading settings:', e);
            }
        }
        this.applySettings();
    }
    
    saveSettings() {
        try {
            localStorage.setItem('notepad-settings', JSON.stringify(this.settings));
        } catch (e) {
            console.error('Error saving settings:', e);
        }
    }
    
    applySettings() {
        document.documentElement.style.setProperty('--font-size', `${this.settings.fontSize}px`);
        document.documentElement.style.setProperty('--line-height', this.settings.lineHeight);
        
        // Update form controls if they exist
        setTimeout(() => {
            const fontSizeSlider = document.getElementById('font-size-slider');
            const lineHeightSlider = document.getElementById('line-height-slider');
            const autoSaveToggle = document.getElementById('auto-save-toggle');
            const fontSizeValue = document.getElementById('font-size-value');
            const lineHeightValue = document.getElementById('line-height-value');
            
            if (fontSizeSlider) fontSizeSlider.value = this.settings.fontSize;
            if (lineHeightSlider) lineHeightSlider.value = this.settings.lineHeight;
            if (autoSaveToggle) autoSaveToggle.checked = this.settings.autoSave;
            if (fontSizeValue) fontSizeValue.textContent = `${this.settings.fontSize}px`;
            if (lineHeightValue) lineHeightValue.textContent = this.settings.lineHeight;
            
            this.updateSoundToggle();
        }, 100);
    }
    
    applyInitialModes() {
        if (this.settings.focusMode) {
            document.body.classList.add('focus-mode');
            const focusBtn = document.getElementById('focus-mode');
            if (focusBtn) focusBtn.classList.add('active');
        }
        
        if (this.settings.typewriterMode) {
            document.body.classList.add('typewriter-mode');
            const typewriterBtn = document.getElementById('typewriter-mode');
            if (typewriterBtn) typewriterBtn.classList.add('active');
        }
    }
    
    loadDocuments() {
        const saved = localStorage.getItem('notepad-documents');
        if (saved) {
            try {
                this.documents = JSON.parse(saved);
                if (this.documents.length > 0) {
                    this.documentCounter = Math.max(...this.documents.map(d => d.id)) + 1;
                    this.activeDocumentId = this.documents[0].id;
                }
            } catch (e) {
                console.error('Error loading documents:', e);
                this.documents = [];
            }
        }
        
        if (this.documents.length === 0) {
            this.createInitialDocument();
        }
        
        this.renderTabs();
        this.switchDocument(this.activeDocumentId);
    }
    
    createInitialDocument() {
        const initialContent = `# Welcome to Minimalist Notepad

Start typing your markdown here...

## Features

- **Markdown** support with live preview
- **LaTeX** math: $E = mc^2$
- **Code blocks** with syntax highlighting
- **Typewriter sounds** (toggle in toolbar)
- **Export** to PDF or plain text
- **Search & Replace** with regex support
- **Multiple themes** (light, dark, sepia)
- **Focus mode** and **Typewriter mode**

\`\`\`javascript
console.log("Hello, World!");
\`\`\`

$$\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$`;

        const doc = {
            id: this.documentCounter++,
            title: 'Welcome to Minimalist Notepad',
            content: initialContent,
            lastModified: new Date().toISOString()
        };
        
        this.documents.push(doc);
        this.activeDocumentId = doc.id;
        this.saveDocuments();
    }
    
    saveDocuments() {
        try {
            localStorage.setItem('notepad-documents', JSON.stringify(this.documents));
            this.updateSaveStatus('saved');
        } catch (e) {
            console.error('Error saving documents:', e);
            this.updateSaveStatus('error');
        }
    }
    
    createDocument(title = 'Untitled', content = '') {
        const doc = {
            id: this.documentCounter++,
            title: title || 'Untitled',
            content: content || '',
            lastModified: new Date().toISOString()
        };
        
        this.documents.push(doc);
        this.saveDocuments();
        this.renderTabs();
        this.switchDocument(doc.id);
        this.showNotification('New document created!');
        
        // Focus on editor
        setTimeout(() => {
            const editor = document.getElementById('editor');
            if (editor) {
                editor.focus();
            }
        }, 100);
        
        return doc;
    }
    
    updateDocument(id, content) {
        const doc = this.documents.find(d => d.id === id);
        if (doc) {
            doc.content = content;
            doc.lastModified = new Date().toISOString();
            
            // Update title based on first line
            const firstLine = content.split('\n')[0].replace(/^#+\s*/, '').trim();
            if (firstLine) {
                doc.title = firstLine.length > 30 ? firstLine.substring(0, 30) + '...' : firstLine;
            } else {
                doc.title = 'Untitled';
            }
            
            this.renderTabs();
            this.saveDocuments();
        }
    }
    
    deleteDocument(id) {
        if (this.documents.length <= 1) {
            this.showNotification('Cannot delete the last document');
            return;
        }
        
        const index = this.documents.findIndex(d => d.id === id);
        if (index !== -1) {
            this.documents.splice(index, 1);
            
            if (this.activeDocumentId === id) {
                const newActiveId = this.documents[Math.max(0, index - 1)].id;
                this.switchDocument(newActiveId);
            }
            
            this.saveDocuments();
            this.renderTabs();
            this.showNotification('Document deleted');
        }
    }
    
    switchDocument(id) {
        this.activeDocumentId = id;
        const doc = this.documents.find(d => d.id === id);
        if (doc) {
            const editor = document.getElementById('editor');
            if (editor) {
                editor.value = doc.content;
                this.updatePreview();
                this.updateWordCount();
            }
            this.renderTabs();
        }
    }
    
    renderTabs() {
        const tabsContainer = document.getElementById('document-tabs');
        if (!tabsContainer) return;
        
        tabsContainer.innerHTML = '';
        
        this.documents.forEach(doc => {
            const tab = document.createElement('div');
            tab.className = `tab ${doc.id === this.activeDocumentId ? 'active' : ''}`;
            tab.dataset.id = doc.id;
            
            const tabTitle = document.createElement('span');
            tabTitle.className = 'tab-title';
            tabTitle.textContent = doc.title;
            
            const tabClose = document.createElement('button');
            tabClose.className = 'tab-close';
            tabClose.textContent = '×';
            tabClose.title = 'Close document';
            
            tab.appendChild(tabTitle);
            tab.appendChild(tabClose);
            
            // Add event listeners
            tabTitle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.switchDocument(doc.id);
            });
            
            tabClose.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.deleteDocument(doc.id);
            });
            
            tabsContainer.appendChild(tab);
        });
    }
    
    setupEventListeners() {
        // Editor events
        const editor = document.getElementById('editor');
        if (editor) {
            editor.addEventListener('input', (e) => {
                if (this.initialized) {
                    this.updateDocument(this.activeDocumentId, e.target.value);
                    this.updatePreview();
                    this.updateWordCount();
                    this.updateSaveStatus('saving');
                    this.playTypewriterSound();
                }
            });
        }
        
        // Toolbar buttons
        const newDocBtn = document.getElementById('new-doc');
        if (newDocBtn) {
            newDocBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.createDocument();
            });
        }
        
        const saveDocBtn = document.getElementById('save-doc');
        if (saveDocBtn) {
            saveDocBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveDocument();
            });
        }
        
        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSearchModal();
            });
        }
        
        const focusModeBtn = document.getElementById('focus-mode');
        if (focusModeBtn) {
            focusModeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleFocusMode();
            });
        }
        
        const typewriterModeBtn = document.getElementById('typewriter-mode');
        if (typewriterModeBtn) {
            typewriterModeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleTypewriterMode();
            });
        }
        
        const soundToggleBtn = document.getElementById('sound-toggle');
        if (soundToggleBtn) {
            soundToggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleSound();
            });
        }
        
        const copyBtn = document.getElementById('copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.copyToClipboard();
            });
        }
        
        const exportPdfBtn = document.getElementById('export-pdf');
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.exportToPDF();
            });
        }
        
        const exportTxtBtn = document.getElementById('export-txt');
        if (exportTxtBtn) {
            exportTxtBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.exportToText();
            });
        }
        
        // Header buttons
        const themeToggleBtn = document.getElementById('theme-toggle');
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.cycleTheme();
            });
        }
        
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSettingsModal();
            });
        }
        
        // Tab management
        const addTabBtn = document.getElementById('add-tab');
        if (addTabBtn) {
            addTabBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.createDocument();
            });
        }
        
        // Search modal
        const closeSearchBtn = document.getElementById('close-search');
        if (closeSearchBtn) {
            closeSearchBtn.addEventListener('click', () => this.hideSearchModal());
        }
        
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.performSearch());
        }
        
        const findNextBtn = document.getElementById('find-next');
        if (findNextBtn) {
            findNextBtn.addEventListener('click', () => this.findNext());
        }
        
        const replaceBtn = document.getElementById('replace-btn');
        if (replaceBtn) {
            replaceBtn.addEventListener('click', () => this.replaceSelection());
        }
        
        const replaceAllBtn = document.getElementById('replace-all');
        if (replaceAllBtn) {
            replaceAllBtn.addEventListener('click', () => this.replaceAll());
        }
        
        // Settings modal
        const closeSettingsBtn = document.getElementById('close-settings');
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => this.hideSettingsModal());
        }
        
        const fontSizeSlider = document.getElementById('font-size-slider');
        if (fontSizeSlider) {
            fontSizeSlider.addEventListener('input', (e) => this.updateFontSize(e.target.value));
        }
        
        const lineHeightSlider = document.getElementById('line-height-slider');
        if (lineHeightSlider) {
            lineHeightSlider.addEventListener('input', (e) => this.updateLineHeight(e.target.value));
        }
        
        const autoSaveToggle = document.getElementById('auto-save-toggle');
        if (autoSaveToggle) {
            autoSaveToggle.addEventListener('change', (e) => this.toggleAutoSave(e.target.checked));
        }
        
        // Modal backdrop clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
            }
        });
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        this.saveDocument();
                        break;
                    case 'n':
                        e.preventDefault();
                        this.createDocument();
                        break;
                    case 'f':
                        e.preventDefault();
                        this.showSearchModal();
                        break;
                    case 'h':
                        e.preventDefault();
                        this.showSearchModal();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.exportToPDF();
                        break;
                    case 't':
                        e.preventDefault();
                        this.toggleTypewriterMode();
                        break;
                }
                
                if (e.shiftKey && e.key === 'F') {
                    e.preventDefault();
                    this.toggleFocusMode();
                }
            }
            
            if (e.key === 'Escape') {
                this.hideSearchModal();
                this.hideSettingsModal();
            }
        });
    }
    
    updatePreview() {
        const editor = document.getElementById('editor');
        const preview = document.getElementById('preview');
        
        if (!editor || !preview) return;
        
        const content = editor.value;
        
        try {
            let html = '';
            if (window.marked) {
                html = marked.parse(content);
            } else {
                // Fallback basic markdown parsing
                html = content
                    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                    .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*)\*/g, '<em>$1</em>')
                    .replace(/\n/g, '<br>');
            }
            
            // Render LaTeX if KaTeX is available
            if (window.katex) {
                html = html.replace(/\$\$(.*?)\$\$/gs, (match, latex) => {
                    try {
                        return katex.renderToString(latex, { displayMode: true });
                    } catch (e) {
                        return match;
                    }
                });
                
                html = html.replace(/\$(.*?)\$/g, (match, latex) => {
                    try {
                        return katex.renderToString(latex, { displayMode: false });
                    } catch (e) {
                        return match;
                    }
                });
            }
            
            preview.innerHTML = html;
            
            // Highlight code blocks if Prism is available
            if (window.Prism) {
                Prism.highlightAllUnder(preview);
            }
            
        } catch (e) {
            console.error('Error rendering preview:', e);
            preview.innerHTML = '<p>Error rendering preview</p>';
        }
    }
    
    updateWordCount() {
        const editor = document.getElementById('editor');
        if (!editor) return;
        
        const content = editor.value;
        const words = content.trim().split(/\s+/).filter(w => w.length > 0).length;
        const chars = content.length;
        
        const wordCountEl = document.getElementById('word-count');
        const charCountEl = document.getElementById('char-count');
        
        if (wordCountEl) wordCountEl.textContent = `${words} words`;
        if (charCountEl) charCountEl.textContent = `${chars} characters`;
    }
    
    updateSaveStatus(status) {
        const statusElement = document.getElementById('save-status');
        if (statusElement) {
            statusElement.textContent = status === 'saving' ? 'Saving...' : status === 'saved' ? 'Saved' : 'Error';
            statusElement.className = status;
        }
    }
    
    setupAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        if (this.settings.autoSave) {
            this.autoSaveTimer = setInterval(() => {
                this.saveDocument();
            }, 5000);
        }
    }
    
    saveDocument() {
        try {
            this.saveDocuments();
            this.saveSettings();
            this.showNotification('Document saved!');
        } catch (e) {
            console.error('Error saving document:', e);
            this.updateSaveStatus('error');
            this.showNotification('Error saving document');
        }
    }
    
    playTypewriterSound() {
        if (this.settings.typewriterSounds) {
            const audio = document.getElementById('typewriter-sound');
            if (audio) {
                audio.currentTime = 0;
                audio.play().catch(() => {});
            }
        }
    }
    
    toggleSound() {
        this.settings.typewriterSounds = !this.settings.typewriterSounds;
        this.updateSoundToggle();
        this.saveSettings();
        this.showNotification(`Typewriter sounds ${this.settings.typewriterSounds ? 'enabled' : 'disabled'}`);
    }
    
    updateSoundToggle() {
        const button = document.getElementById('sound-toggle');
        if (button) {
            if (this.settings.typewriterSounds) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        }
    }
    
    cycleTheme() {
        const themes = ['light', 'dark', 'sepia'];
        const currentIndex = themes.indexOf(this.settings.theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.settings.theme = themes[nextIndex];
        this.applyTheme();
        this.saveSettings();
        this.showNotification(`Theme changed to ${this.settings.theme}`);
    }
    
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.settings.theme);
        
        // Toggle Prism themes
        const lightTheme = document.querySelector('link[href*="prism.min.css"]');
        const darkTheme = document.querySelector('.prism-dark-theme');
        
        if (lightTheme && darkTheme) {
            if (this.settings.theme === 'dark') {
                lightTheme.disabled = true;
                darkTheme.disabled = false;
            } else {
                lightTheme.disabled = false;
                darkTheme.disabled = true;
            }
        }
    }
    
    toggleFocusMode() {
        this.settings.focusMode = !this.settings.focusMode;
        const button = document.getElementById('focus-mode');
        
        if (this.settings.focusMode) {
            document.body.classList.add('focus-mode');
            if (button) button.classList.add('active');
            this.showNotification('Focus mode enabled');
        } else {
            document.body.classList.remove('focus-mode');
            if (button) button.classList.remove('active');
            this.showNotification('Focus mode disabled');
        }
        
        this.saveSettings();
    }
    
    toggleTypewriterMode() {
        this.settings.typewriterMode = !this.settings.typewriterMode;
        const button = document.getElementById('typewriter-mode');
        
        if (this.settings.typewriterMode) {
            document.body.classList.add('typewriter-mode');
            if (button) button.classList.add('active');
            this.showNotification('Typewriter mode enabled');
        } else {
            document.body.classList.remove('typewriter-mode');
            if (button) button.classList.remove('active');
            this.showNotification('Typewriter mode disabled');
        }
        
        this.saveSettings();
    }
    
    showSearchModal() {
        const modal = document.getElementById('search-modal');
        if (modal) {
            modal.classList.add('active');
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                setTimeout(() => searchInput.focus(), 100);
            }
        }
    }
    
    hideSearchModal() {
        const modal = document.getElementById('search-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    showSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.add('active');
        }
    }
    
    hideSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    performSearch() {
        const searchInput = document.getElementById('search-input');
        const searchTerm = searchInput ? searchInput.value : '';
        const editor = document.getElementById('editor');
        
        if (!editor || !searchTerm) {
            this.searchResults = [];
            return;
        }
        
        const content = editor.value;
        const isRegex = document.getElementById('regex-checkbox')?.checked || false;
        const caseSensitive = document.getElementById('case-sensitive')?.checked || false;
        
        try {
            let regex;
            if (isRegex) {
                regex = new RegExp(searchTerm, caseSensitive ? 'g' : 'gi');
            } else {
                regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseSensitive ? 'g' : 'gi');
            }
            
            this.searchResults = [];
            let match;
            while ((match = regex.exec(content)) !== null) {
                this.searchResults.push({
                    index: match.index,
                    length: match[0].length
                });
            }
            
            this.searchIndex = -1;
            this.findNext();
        } catch (e) {
            console.error('Search error:', e);
            this.showNotification('Search error: Invalid regex');
        }
    }
    
    findNext() {
        if (this.searchResults.length === 0) {
            this.showNotification('No matches found');
            return;
        }
        
        this.searchIndex = (this.searchIndex + 1) % this.searchResults.length;
        const result = this.searchResults[this.searchIndex];
        
        const editor = document.getElementById('editor');
        if (editor) {
            editor.focus();
            editor.setSelectionRange(result.index, result.index + result.length);
            
            // Scroll to selection
            const rect = editor.getBoundingClientRect();
            const lineHeight = parseInt(getComputedStyle(editor).lineHeight);
            const lines = editor.value.substring(0, result.index).split('\n').length;
            const scrollTop = (lines - 1) * lineHeight - rect.height / 2;
            editor.scrollTop = Math.max(0, scrollTop);
        }
    }
    
    replaceSelection() {
        const editor = document.getElementById('editor');
        const replaceInput = document.getElementById('replace-input');
        
        if (!editor || !replaceInput) return;
        
        const replaceText = replaceInput.value;
        
        if (editor.selectionStart !== editor.selectionEnd) {
            const content = editor.value;
            const newContent = content.substring(0, editor.selectionStart) + 
                             replaceText + 
                             content.substring(editor.selectionEnd);
            
            editor.value = newContent;
            this.updateDocument(this.activeDocumentId, newContent);
            this.updatePreview();
            this.updateWordCount();
            this.showNotification('Text replaced');
        }
    }
    
    replaceAll() {
        const searchInput = document.getElementById('search-input');
        const replaceInput = document.getElementById('replace-input');
        
        if (!searchInput || !replaceInput) return;
        
        const searchTerm = searchInput.value;
        const replaceText = replaceInput.value;
        
        if (!searchTerm) {
            this.showNotification('Please enter search term');
            return;
        }
        
        const editor = document.getElementById('editor');
        if (!editor) return;
        
        const content = editor.value;
        const isRegex = document.getElementById('regex-checkbox')?.checked || false;
        const caseSensitive = document.getElementById('case-sensitive')?.checked || false;
        
        try {
            let regex;
            if (isRegex) {
                regex = new RegExp(searchTerm, caseSensitive ? 'g' : 'gi');
            } else {
                regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseSensitive ? 'g' : 'gi');
            }
            
            const newContent = content.replace(regex, replaceText);
            const replacements = (content.match(regex) || []).length;
            
            editor.value = newContent;
            this.updateDocument(this.activeDocumentId, newContent);
            this.updatePreview();
            this.updateWordCount();
            this.showNotification(`${replacements} replacements made`);
        } catch (e) {
            console.error('Replace error:', e);
            this.showNotification('Replace error: Invalid regex');
        }
    }
    
    async copyToClipboard() {
        try {
            const editor = document.getElementById('editor');
            if (!editor) return;
            
            const content = editor.value;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(content);
                this.showNotification('Copied to clipboard!');
            } else {
                // Fallback for browsers without clipboard API
                const textarea = document.createElement('textarea');
                textarea.value = content;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                this.showNotification('Copied to clipboard!');
            }
        } catch (e) {
            console.error('Copy error:', e);
            this.showNotification('Failed to copy to clipboard');
        }
    }
    
    exportToPDF() {
        try {
            if (!window.jspdf) {
                this.showNotification('PDF export not available');
                return;
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const editor = document.getElementById('editor');
            if (!editor) return;
            
            const content = editor.value;
            
            // Convert markdown to plain text for PDF
            const plainText = content.replace(/[#*`_~]/g, '');
            
            // Split text into lines and add to PDF
            const lines = doc.splitTextToSize(plainText, 180);
            let y = 20;
            
            lines.forEach(line => {
                if (y > 280) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(line, 10, y);
                y += 7;
            });
            
            const activeDoc = this.documents.find(d => d.id === this.activeDocumentId);
            const filename = `${activeDoc?.title || 'document'}.pdf`;
            doc.save(filename);
            
            this.showNotification('PDF exported successfully!');
        } catch (e) {
            console.error('PDF export error:', e);
            this.showNotification('Failed to export PDF');
        }
    }
    
    exportToText() {
        try {
            const editor = document.getElementById('editor');
            if (!editor) return;
            
            const content = editor.value;
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            
            const activeDoc = this.documents.find(d => d.id === this.activeDocumentId);
            a.download = `${activeDoc?.title || 'document'}.txt`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showNotification('Text file exported successfully!');
        } catch (e) {
            console.error('Text export error:', e);
            this.showNotification('Failed to export text file');
        }
    }
    
    updateFontSize(size) {
        this.settings.fontSize = parseInt(size);
        document.documentElement.style.setProperty('--font-size', `${size}px`);
        const fontSizeValue = document.getElementById('font-size-value');
        if (fontSizeValue) {
            fontSizeValue.textContent = `${size}px`;
        }
        this.saveSettings();
    }
    
    updateLineHeight(height) {
        this.settings.lineHeight = parseFloat(height);
        document.documentElement.style.setProperty('--line-height', height);
        const lineHeightValue = document.getElementById('line-height-value');
        if (lineHeightValue) {
            lineHeightValue.textContent = height;
        }
        this.saveSettings();
    }
    
    toggleAutoSave(enabled) {
        this.settings.autoSave = enabled;
        this.setupAutoSave();
        this.saveSettings();
        this.showNotification(`Auto-save ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    showNotification(message) {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(n => n.remove());
        
        // Create new notification
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--accent);
            color: var(--bg-primary);
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 14px;
            z-index: 10000;
            opacity: 0;
            transform: translateY(-20px);
            transition: all 0.3s ease;
            font-family: var(--font-mono);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.notepadApp = new MinimalistNotepad();
});

// Service Worker registration for offline support
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(e => {
        console.log('Service Worker registration failed:', e);
    });
}