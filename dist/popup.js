document.addEventListener('DOMContentLoaded', () => {

    const newText = document.getElementById('newText');
    const addText = document.getElementById('addText');
    const textList = document.getElementById('textList');
    const exportTexts = document.getElementById('exportTexts');
    const importTexts = document.getElementById('importTexts');
    const importFile = document.getElementById('importFile');
    const searchInput = document.getElementById('searchInput');

    searchInput.focus();

    function updateUI() {

        chrome.storage.local.get('texts', ({ texts }) => {
            if (!Array.isArray(texts) || !texts.length) {
                chrome.storage.local.set({ 'texts': [] });
            }
        });

        chrome.storage.local.get('texts', ({ texts }) => {
            textList.innerHTML = '';
            (texts || []).forEach((text, index) => {
                const listItem = document.createElement('li');
                listItem.classList.add('list-group-item', 'justify-content-between', 'align-items-center');
                listItem.textContent = text;
                listItem.style.cursor = 'pointer';
                listItem.style.display = 'flex';

                listItem.addEventListener('click', () => {
                    navigator.clipboard.writeText(text);
                    try {
                        chrome.tabs.query({
                            active: true,
                            currentWindow: true
                        }, function(tabs) {
                            chrome.scripting.executeScript({
                                target: {
                                    tabId: tabs[0].id
                                },
                                args: [text],
                                function: function (text) {
                                    let textarea = document.querySelector("textarea.m-0.w-full.resize-none.border-0.bg-transparent");
                                    if (textarea) {
                                        textarea.value = text;
                                        textarea.dispatchEvent(new Event('input', { bubbles: true }));
                                    }
                                },
                            });
                        });
                        window.close();
                    } catch (error) {
                        console.log(error);
                    }
                });

                const deleteButton = document.createElement('button');
                deleteButton.classList.add('btn', 'btn-danger', 'btn-sm', 'float-right');
                deleteButton.textContent = 'X';
                deleteButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    texts.splice(index, 1);
                    chrome.storage.local.set({ texts }, updateUI);
                });

                listItem.appendChild(deleteButton);
                textList.appendChild(listItem);
            });
        });
    }

    addText.addEventListener('click', () => {
        const text = newText.value;
        if (text) {
            chrome.storage.local.get('texts', ({ texts }) => {
                texts.push(text);
                chrome.storage.local.set({ texts }, updateUI);
                newText.value = '';
            });
        }
    });

    exportTexts.addEventListener('click', () => {
        chrome.storage.local.get('texts', ({ texts }) => {
            const fileContent = JSON.stringify({ texts }, null, 2);
            const file = new Blob([fileContent], { type: 'application/json' });
            const url = URL.createObjectURL(file);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'texts_export.json';
            link.click();
            URL.revokeObjectURL(url);
        });
    });

    importTexts.addEventListener('click', () => {
        importFile.click();
    });

    importFile.addEventListener('change', () => {
        const file = importFile.files[0];
        if (file) {
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onload = () => {
                try {
                    const { texts } = JSON.parse(reader.result);
                    if (Array.isArray(texts)) {
                        chrome.storage.local.set({ texts }, updateUI);
                    }
                } catch (error) {
                    console.error('Invalid JSON file:', error.message);
                }
            };
        }
    });

    searchInput.addEventListener('input', () => {
        let list = textList.querySelectorAll('li');
        list.forEach((item) => {
            let itemTextLower = item.textContent.toLowerCase();
            let searchWords = searchInput.value.toLowerCase().split(/\s+/g).filter(word => word !== '');
            if (searchWords.every(word => itemTextLower.includes(word))) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });

    updateUI();
});


