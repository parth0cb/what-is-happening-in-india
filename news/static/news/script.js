document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    const getNewsBtn = document.getElementById('get-news');
    const lookbackMinutes = document.getElementById('lookback-minutes');
    const summaryType = document.getElementById('summary-type');
    const loadingSection = document.getElementById('loading');
    const loadingMessage = document.getElementById('loading-message');
    const progressFill = document.getElementById('progress-fill');
    const resultsSection = document.getElementById('results');
    const summariesContainer = document.getElementById('summaries-container');
    const tokensInfo = document.getElementById('tokens-info');
    const errorSection = document.getElementById('error');
    const errorMessage = document.getElementById('error-message');
    const warningSection = document.getElementById('summarizer-warning');
    
    let abortController = null;
    let isProcessing = false;
    let currentSummaries = [];

    // Theme toggle
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeToggle(currentTheme);

    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeToggle(newTheme);
    });

    function updateThemeToggle(theme) {
        themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
    }

    // Check summarizer status on load
    checkSummarizerStatus();

    // Get news button click
    getNewsBtn.addEventListener('click', handleButtonClick);

    async function checkSummarizerStatus() {
        try {
            const response = await fetch('/api/check-summarizer/');
            const data = await response.json();
            
            if (!data.available) {
                warningSection.classList.remove('hidden');
                getNewsBtn.disabled = true;
                getNewsBtn.textContent = 'Configure LLM to Enable';
                getNewsBtn.style.backgroundColor = 'var(--text-secondary)';
            } else {
                getNewsBtn.disabled = false;
                getNewsBtn.textContent = isProcessing ? 'Stop' : 'Fetch';
                getNewsBtn.style.backgroundColor = '';
                if (isProcessing) {
                    getNewsBtn.classList.add('stop');
                } else {
                    getNewsBtn.classList.remove('stop');
                }
            }
        } catch (error) {
            console.error('Error checking summarizer status:', error);
            getNewsBtn.disabled = true;
            getNewsBtn.textContent = 'Error Checking LLM Status';
        }
    }

    function handleButtonClick() {
        if (isProcessing) {
            stopProcess();
        } else {
            getNewsSummary();
        }
    }

    function stopProcess() {
        if (abortController) {
            abortController.abort();
            abortController = null;
        }
        isProcessing = false;
        getNewsBtn.textContent = 'Fetch';
        getNewsBtn.classList.remove('stop');
        getNewsBtn.disabled = false;
        loadingSection.classList.add('hidden');
        showError('Process stopped by user');
    }

async function getNewsSummary() {
        const minutes = Math.min(parseInt(lookbackMinutes.value) || 60, 120);
        const summaryTypeValue = summaryType.value;

        // Reset UI
        hideAllSections();
        isProcessing = true;
        currentSummaries = [];
        getNewsBtn.textContent = 'Stop';
        getNewsBtn.classList.add('stop');
        getNewsBtn.disabled = false;
        loadingSection.classList.remove('hidden');
        tokensInfo.classList.remove('hidden');
        updateTokens(0, 0);
        
        // Create abort controller for this request
        abortController = new AbortController();

        try {
            updateLoading('Scraping news articles...', 10);

            const response = await fetch('/api/get-news-summary/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({
                    lookback_minutes: minutes,
                    summary_type: summaryTypeValue
                }),
                signal: abortController.signal
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            
                            if (data.type === 'progress') {
                                updateLoading(data.message, data.progress);
                            } else if (data.type === 'tokens') {
                                updateTokens(data.input_tokens, data.output_tokens);
                            } else if (data.type === 'summary') {
                                currentSummaries.push(data);
                                displayResults(currentSummaries);
                             } else if (data.type === 'result') {
                                currentSummaries = data.summaries;
                                updateLoading('Finalizing results...', 85);

                                // Show results
                                setTimeout(() => {
                                    displayResults(currentSummaries);
                                    updateTokens(data.total_input_tokens, data.total_output_tokens);
                                    updateLoading('Complete!', 100);

                                    setTimeout(() => {
                                        loadingSection.classList.add('hidden');
                                        resultsSection.classList.remove('hidden');
                                        isProcessing = false;
                                        getNewsBtn.textContent = 'Fetch';
                                        getNewsBtn.classList.remove('stop');
                                        getNewsBtn.disabled = false;
                                        abortController = null;
                                    }, 500);
                                }, 500);

                                // Show warning if summarizer is unavailable
                                if (!data.summarizer_available) {
                                    warningSection.classList.remove('hidden');
                                }
                            }
                        } catch (e) {
                            console.error('Error parsing SSE data:', e);
                        }
                    }
                }
            }

        } catch (error) {
            console.error('Error:', error);
            if (error.name === 'AbortError') {
                // Show partial results
                loadingSection.classList.add('hidden');
                resultsSection.classList.remove('hidden');
                displayResults(currentSummaries);
                updateLoading('Stopped by user', 100);
            } else {
                showError(error.message);
            }
            isProcessing = false;
            getNewsBtn.textContent = 'Fetch';
            getNewsBtn.classList.remove('stop');
            getNewsBtn.disabled = false;
            abortController = null;
            currentSummaries = [];
        }
    }

    function updateLoading(message, progress) {
        loadingMessage.textContent = message;
        progressFill.style.width = progress + '%';
    }

    function updateTokens(inputTokens, outputTokens) {
        tokensInfo.innerHTML = `<p>Total Input Tokens: ${inputTokens} | Total Output Tokens: ${outputTokens}</p>`;
    }

    function displayResults(summaries) {
        summariesContainer.innerHTML = '';

        if (summaries.length === 0) {
            summariesContainer.innerHTML = '<p>No articles found in the specified time range.</p>';
            return;
        }

        summaries.forEach(summary => {
            const summaryItem = document.createElement('div');
            summaryItem.className = 'summary-item';

            const publishedTime = new Date(summary.published_time);
            const timeString = publishedTime.toLocaleString();

            summaryItem.innerHTML = `
                <p>${escapeHtml(summary.summary)}</p>
                <div class="time">Published: ${timeString}</div>
            `;

            summariesContainer.appendChild(summaryItem);
        });
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorSection.classList.remove('hidden');
        loadingSection.classList.add('hidden');
    }

    function hideAllSections() {
        loadingSection.classList.add('hidden');
        resultsSection.classList.add('hidden');
        errorSection.classList.add('hidden');
        warningSection.classList.add('hidden');
        tokensInfo.classList.add('hidden');
    }

    function getCsrfToken() {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'csrftoken') {
                return decodeURIComponent(value);
            }
        }
        return '';
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});