document.addEventListener('DOMContentLoaded', function() {
    const categoryFilter = document.getElementById('category-filter');
    const docList = document.getElementById('doc-list');
    const categoriesDatalist = document.getElementById('categories');
    
    const editorForm = document.getElementById('editor-form');
    const docCategory = document.getElementById('doc-category');
    const docTitle = document.getElementById('doc-title');
    const docUrl = document.getElementById('doc-url');
    const docContent = document.getElementById('doc-content');
    
    const btnNew = document.getElementById('btn-new');
    const btnImport = document.getElementById('btn-import');
    const btnExport = document.getElementById('btn-export');
    const btnDelete = document.getElementById('btn-delete');
    
    const tabs = document.querySelectorAll('.tab');
    const editorContainer = document.getElementById('editor-container');
    const previewContainer = document.getElementById('preview-container');
    const previewTitle = document.getElementById('preview-title');
    const previewContent = document.getElementById('preview-content');
    
    const importModalOverlay = document.getElementById('import-modal-overlay');
    const importModal = document.getElementById('import-modal');
    const importFile = document.getElementById('import-file');
    const importError = document.getElementById('import-error');
    const btnImportSubmit = document.getElementById('btn-import-submit');
    const btnImportCancel = document.getElementById('btn-import-cancel');
    const importModalClose = document.getElementById('import-modal-close');
    const fileName = document.getElementById('file-name');
    
    const confirmModalOverlay = document.getElementById('confirm-modal-overlay');
    const confirmModal = document.getElementById('confirm-modal');
    const confirmTitle = document.getElementById('confirm-title');
    const confirmMessage = document.getElementById('confirm-message');
    const btnConfirmOk = document.getElementById('btn-confirm-ok');
    const btnConfirmCancel = document.getElementById('btn-confirm-cancel');
    const confirmModalClose = document.getElementById('confirm-modal-close');
    
    const mergeModalOverlay = document.getElementById('merge-modal-overlay');
    const mergeModal = document.getElementById('merge-modal');
    const btnMerge = document.getElementById('btn-merge');
    const btnReplace = document.getElementById('btn-replace');
    const mergeModalClose = document.getElementById('merge-modal-close');
    
    const toastContainer = document.getElementById('toast-container');
    
    let docs = [];
    let categories = new Set();
    let currentDocId = null;
    let isSmallScreen = window.innerWidth <= 900;
    let importedData = null;
    let confirmCallback = null;
    
    
    function init() {
        loadData();
        
        checkScreenSize();
        
        renderCategoryFilter();
        renderDocList();
        renderCategoriesDatalist();
        
        setupEventListeners();
    }
    
    function checkScreenSize() {
        isSmallScreen = window.innerWidth <= 900;
        
        if (isSmallScreen) {
            document.querySelector('.tab-header').style.display = 'flex';
            
            const activeTab = document.querySelector('.tab.active').getAttribute('data-tab');
            if (activeTab === 'editor') {
                editorContainer.classList.remove('hidden');
                previewContainer.classList.add('hidden');
            } else {
                editorContainer.classList.add('hidden');
                previewContainer.classList.remove('hidden');
            }
        } else {
            document.querySelector('.tab-header').style.display = 'none';
            
            editorContainer.classList.remove('hidden');
            previewContainer.classList.remove('hidden');
        }
    }
    
    function loadData() {
        const storedDocs = localStorage.getItem('docwriter_docs');
        if (storedDocs) {
            try {
                docs = JSON.parse(storedDocs);
                updateCategories();
            } catch (e) {
                console.error('Error loading data:', e);
                docs = [];
            }
        }
    }
    
    function saveData() {
        localStorage.setItem('docwriter_docs', JSON.stringify(docs));
    }
    
    function updateCategories() {
        categories = new Set(docs.map(doc => doc.category));
    }
    
    function renderCategoryFilter() {
        while (categoryFilter.options.length > 1) {
            categoryFilter.remove(1);
        }
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }
    
    function renderDocList() {
        docList.innerHTML = '';
        
        const selectedCategory = categoryFilter.value;
        
        const filteredDocs = selectedCategory === 'all' ? 
            docs : docs.filter(doc => doc.category === selectedCategory);
        
        if (filteredDocs.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'doc-item';
            emptyMessage.style.fontStyle = 'italic';
            emptyMessage.style.color = 'var(--color-secondary)';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.textContent = 'No documents found';
            docList.appendChild(emptyMessage);
            return;
        }
        
        filteredDocs.forEach(doc => {
            const docItem = document.createElement('div');
            docItem.className = `doc-item${currentDocId === doc.id ? ' active' : ''}`;
            docItem.textContent = doc.title;
            docItem.setAttribute('data-id', doc.id);
            
            docItem.addEventListener('click', () => {
                selectDoc(doc.id);
            });
            
            docList.appendChild(docItem);
        });
    }
    
    function renderCategoriesDatalist() {
        categoriesDatalist.innerHTML = '';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            categoriesDatalist.appendChild(option);
        });
    }
    
    function selectDoc(id) {
        currentDocId = id;
        
        const doc = docs.find(d => d.id === id);
        
        if (doc) {
            docCategory.value = doc.category;
            docTitle.value = doc.title;
            docUrl.value = doc.url || '';
            docContent.value = doc.message || '';
            
            updatePreview();
            
            btnDelete.style.display = 'block';
            
            if (isSmallScreen) {
                switchTab('editor');
            }
        } else {
            clearEditor();
        }
        
        renderDocList();
    }
    
    function clearEditor() {
        currentDocId = null;
        editorForm.reset();
        previewTitle.textContent = 'Document Title';
        previewContent.innerHTML = '<p>Select or create a document to see the preview.</p>';
        btnDelete.style.display = 'none';
        
        renderDocList();
    }
    
    function createNewDoc() {
        clearEditor();
        
        if (isSmallScreen) {
            switchTab('editor');
        }
    }
    
    function saveDoc(e) {
        e.preventDefault();
        
        const category = docCategory.value.trim();
        const title = docTitle.value.trim();
        const url = docUrl.value.trim();
        const content = docContent.value;
        
        if (!category || !title || !content) {
            showToast('Please fill out all required fields.', 'error');
            return;
        }
        
        if (currentDocId) {
            const docIndex = docs.findIndex(d => d.id === currentDocId);
            if (docIndex !== -1) {
                docs[docIndex] = {
                    ...docs[docIndex],
                    category,
                    title,
                    url,
                    message: content
                };
            }
        } else {
            const newDoc = {
                id: Date.now().toString(),
                category,
                title,
                url,
                message: content
            };
            docs.push(newDoc);
            currentDocId = newDoc.id;
        }
        
        updateCategories();
        saveData();
        
        renderCategoryFilter();
        renderDocList();
        renderCategoriesDatalist();
        updatePreview();
        
        showToast(`Document "${title}" saved successfully.`, 'success');
    }
    
    function deleteDoc() {
        if (!currentDocId) return;
        
        const doc = docs.find(d => d.id === currentDocId);
        if (!doc) return;
        
        showConfirmModal(
            'Delete Document',
            `Are you sure you want to delete "${doc.title}"?`,
            () => {
                docs = docs.filter(d => d.id !== currentDocId);
                
                updateCategories();
                saveData();
                clearEditor();
                renderCategoryFilter();
                renderDocList();
                renderCategoriesDatalist();
                
                showToast(`Document "${doc.title}" deleted.`, 'info');
            }
        );
    }
    
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = '📝';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '❌';
        if (type === 'info') icon = 'ℹ️';
        
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('active');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('active');
            setTimeout(() => {
                toastContainer.removeChild(toast);
            }, 300);
        }, 4000);
    }
    
    function showConfirmModal(title, message, onConfirm) {
        confirmTitle.textContent = title;
        confirmMessage.textContent = message;
        confirmCallback = onConfirm;
        
        confirmModalOverlay.style.display = 'block';
        setTimeout(() => {
            confirmModalOverlay.classList.add('active');
            confirmModal.classList.add('active');
        }, 10);
    }
    
    function hideConfirmModal() {
        confirmModalOverlay.classList.remove('active');
        confirmModal.classList.remove('active');
        setTimeout(() => {
            confirmModalOverlay.style.display = 'none';
        }, 300);
    }
    
    function switchTab(tabId) {
        tabs.forEach(tab => {
            if (tab.getAttribute('data-tab') === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        if (isSmallScreen) {
            if (tabId === 'editor') {
                editorContainer.classList.remove('hidden');
                previewContainer.classList.add('hidden');
            } else {
                editorContainer.classList.add('hidden');
                previewContainer.classList.remove('hidden');
                updatePreview();
            }
        }
    }
    
    function updatePreview() {
        const title = docTitle.value || 'Document Title';
        const markdown = docContent.value || '';
        
        previewTitle.textContent = title;
        previewContent.innerHTML = marked.parse(markdown);
    }
    
    function showImportModal() {
        importError.textContent = '';
        fileName.textContent = 'No file selected';
        importFile.value = '';
        
        importModalOverlay.style.display = 'block';
        setTimeout(() => {
            importModalOverlay.classList.add('active');
            importModal.classList.add('active');
        }, 10);
    }
    
    function hideImportModal() {
        importModalOverlay.classList.remove('active');
        importModal.classList.remove('active');
        setTimeout(() => {
            importModalOverlay.style.display = 'none';
        }, 300);
    }
    
    function showMergeModal() {
        mergeModalOverlay.style.display = 'block';
        setTimeout(() => {
            mergeModalOverlay.classList.add('active');
            mergeModal.classList.add('active');
        }, 10);
    }
    
    function hideMergeModal() {
        mergeModalOverlay.classList.remove('active');
        mergeModal.classList.remove('active');
        setTimeout(() => {
            mergeModalOverlay.style.display = 'none';
        }, 300);
    }
    
    function updateFileName() {
        const file = importFile.files[0];
        if (file) {
            fileName.textContent = file.name;
        } else {
            fileName.textContent = 'No file selected';
        }
    }
    
    function processImportFile() {
        const file = importFile.files[0];
        if (!file) {
            importError.textContent = 'Please select a file to import.';
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                importedData = JSON.parse(e.target.result);
                
                if (!Array.isArray(importedData)) {
                    throw new Error('Imported data must be an array of documents.');
                }
                
                importedData.forEach((doc, index) => {
                    if (!doc.category || !doc.title || !doc.message) {
                        throw new Error(`Document at index ${index} is missing required fields.`);
                    }
                    
                    if (!doc.id) {
                        doc.id = Date.now() + index.toString();
                    }
                });
                
                hideImportModal();
                
                if (docs.length > 0) {
                    showMergeModal();
                } else {
                    replaceDocuments();
                }
                
            } catch (error) {
                importError.textContent = `Error importing data: ${error.message}`;
                console.error(error);
            }
        };
        
        reader.onerror = function() {
            importError.textContent = 'Error reading file.';
        };
        
        reader.readAsText(file);
    }
    
    function replaceDocuments() {
        docs = importedData;
        finishImport();
    }
    
    function mergeDocuments() {
        importedData.forEach(importedDoc => {
            const existingIndex = docs.findIndex(d => d.id === importedDoc.id);
            if (existingIndex !== -1) {
                docs[existingIndex] = importedDoc;
            } else {
                docs.push(importedDoc);
            }
        });
        
        finishImport();
    }
    
    function finishImport() {
        updateCategories();
        saveData();
        renderCategoryFilter();
        renderDocList();
        renderCategoriesDatalist();
        
        hideMergeModal();
        showToast(`Successfully imported ${importedData.length} documents.`, 'success');
        importFile.value = '';
        importedData = null;
    }
    
    function exportData() {
        if (docs.length === 0) {
            showToast('No documents to export.', 'error');
            return;
        }
        
        const jsonData = JSON.stringify(docs, null, 2);
        
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'documentation.json';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast(`Exported ${docs.length} documents.`, 'success');
    }
    
    function setupEventListeners() {
        window.addEventListener('resize', checkScreenSize);
        
        categoryFilter.addEventListener('change', renderDocList);
        
        editorForm.addEventListener('submit', saveDoc);
        docContent.addEventListener('input', updatePreview);
        docTitle.addEventListener('input', updatePreview);
        
        btnNew.addEventListener('click', createNewDoc);
        btnImport.addEventListener('click', showImportModal);
        btnExport.addEventListener('click', exportData);
        btnDelete.addEventListener('click', deleteDoc);
        btnImportSubmit.addEventListener('click', processImportFile);
        btnImportCancel.addEventListener('click', hideImportModal);
        
        btnConfirmOk.addEventListener('click', () => {
            if (confirmCallback) confirmCallback();
            hideConfirmModal();
        });
        
        btnConfirmCancel.addEventListener('click', hideConfirmModal);
        confirmModalClose.addEventListener('click', hideConfirmModal);
        
        importModalClose.addEventListener('click', hideImportModal);
        
        btnReplace.addEventListener('click', replaceDocuments);
        btnMerge.addEventListener('click', mergeDocuments);
        mergeModalClose.addEventListener('click', hideMergeModal);
        
        importFile.addEventListener('change', updateFileName);
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                switchTab(tab.getAttribute('data-tab'));
            });
        });
        
        [importModalOverlay, confirmModalOverlay, mergeModalOverlay].forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    if (overlay === importModalOverlay) hideImportModal();
                    if (overlay === confirmModalOverlay) hideConfirmModal();
                    if (overlay === mergeModalOverlay) hideMergeModal();
                }
            });
        });
        
        const fileLabel = document.querySelector('.custom-file-input label');
        
        fileLabel.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileLabel.style.backgroundColor = 'var(--accent-color)';
            fileLabel.style.color = 'white';
        });
        
        fileLabel.addEventListener('dragleave', () => {
            fileLabel.style.backgroundColor = 'var(--bg-tertiary)';
            fileLabel.style.color = 'var(--color-primary)';
        });
        
        fileLabel.addEventListener('drop', (e) => {
            e.preventDefault();
            fileLabel.style.backgroundColor = 'var(--bg-tertiary)';
            fileLabel.style.color = 'var(--color-primary)';
            
            if (e.dataTransfer.files.length) {
                importFile.files = e.dataTransfer.files;
                updateFileName();
            }
        });
    }
    
    init();
});