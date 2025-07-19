// SPF Tools functionality

// Function to format SPF record for better readability
function formatSpfRecord(record) {
    if (!record) return '';
    
    // Split the record into parts, keeping the version at the start
    const parts = record.trim().split(/\s+/);
    const version = parts[0]; // v=spf1
    const mechanisms = parts.slice(1);
    
    // Format each mechanism with proper spacing and color coding
    const formattedMechanisms = mechanisms.map(mechanism => {
        // Color code different types of mechanisms
        let className = 'mechanism';
        if (mechanism.startsWith('include:')) {
            className += ' mechanism-include';
        } else if (mechanism.match(/^[+\-~?]?ip[46]:/)) {
            className += ' mechanism-ip';
        } else if (mechanism.startsWith('mx') || mechanism.startsWith('a')) {
            className += ' mechanism-dns';
        } else if (mechanism === '-all' || mechanism === '~all' || mechanism === '+all' || mechanism === '?all') {
            className += ' mechanism-all';
        }
        
        return `<span class="${className}">${mechanism}</span>`;
    });
    
    return `
        <div class="spf-record-parts">
            <span class="spf-version">${version}</span>
            <div class="spf-mechanisms">
                ${formattedMechanisms.join(' ')}
            </div>
        </div>
    `;
}

async function validateSpfRecord() {
    const domain = document.getElementById('spfDomain').value.trim();
    const resultsDiv = document.getElementById('spfResults');
    
    if (!domain) {
        resultsDiv.innerHTML = '<div class="error-message">Please enter a domain.</div>';
        return;
    }

    try {
        resultsDiv.innerHTML = '<div class="loading">Validating SPF record...</div>';
        
        const response = await fetch(`/api/validate-spf?domain=${encodeURIComponent(domain)}`);
        const data = await response.json();
        
        if (!response.ok) {
            resultsDiv.innerHTML = `
                <div class="error-message">
                    <h3>❌ ${data.error}</h3>
                    ${data.rawRecords ? `
                        <div class="details-section">
                            <h4>Found TXT Records:</h4>
                            <pre>${JSON.stringify(data.rawRecords, null, 2)}</pre>
                        </div>
                    ` : ''}
                    ${data.records ? `
                        <div class="details-section">
                            <h4>Found SPF Records:</h4>
                            <pre>${JSON.stringify(data.records, null, 2)}</pre>
                        </div>
                    ` : ''}
                </div>`;
            return;
        }

        // Format mechanisms table
        const mechanismsTable = data.mechanisms.map(m => `
            <tr>
                <td>${m.qualifier}</td>
                <td>${m.type}</td>
                <td>${m.value || '-'}</td>
                <td>${m.fullText}</td>
            </tr>
        `).join('');

        resultsDiv.innerHTML = `
            <div class="spf-results ${data.isValid ? 'success' : 'error'}">
                <div class="status-section">
                    <h3>${data.isValid ? '✅ Valid SPF Record' : '❌ Invalid SPF Record'}</h3>
                    <div class="record-display">
                        <strong>Record:</strong>
                        <div class="spf-record-formatted">
                            ${formatSpfRecord(data.record)}
                        </div>
                    </div>
                </div>

                ${data.errors.length > 0 ? `
                    <div class="error-section">
                        <h4>⚠️ Errors:</h4>
                        <ul>
                            ${data.errors.map(error => `<li>${error}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                ${data.warnings.length > 0 ? `
                    <div class="warning-section">
                        <h4>⚠️ Warnings:</h4>
                        <ul>
                            ${data.warnings.map(warning => `<li>${warning}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                <div class="mechanisms-section">
                    <h4>📋 Mechanisms:</h4>
                    <table class="mechanisms-table">
                        <thead>
                            <tr>
                                <th>Qualifier</th>
                                <th>Type</th>
                                <th>Value</th>
                                <th>Full Text</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${mechanismsTable}
                        </tbody>
                    </table>
                </div>

                <div class="info-section">
                    <h4>ℹ️ Additional Information:</h4>
                    <ul>
                        <li>Has 'all' mechanism: ${data.hasAll ? '✅ Yes' : '❌ No'}</li>
                        ${data.hasAll ? `<li>'all' mechanism position: ${data.allLocation + 1} of ${data.mechanisms.length + 1}</li>` : ''}
                        <li>Total mechanisms: ${data.mechanisms.length}</li>
                        <li>DNS lookups: ${data.mechanisms.filter(m => ["include", "a", "mx", "exists", "ptr"].includes(m.type)).length}/10</li>
                    </ul>
                </div>
            </div>
        `;
    } catch (error) {
        resultsDiv.innerHTML = `
            <div class="error-message">
                <h3>❌ Error validating SPF record</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

export function initSpfTools() {
    const validateButton = document.getElementById('validateSpf');
    if (validateButton) {
        validateButton.addEventListener('click', validateSpfRecord);
    }

    // Add enter key support
    const domainInput = document.getElementById('spfDomain');
    if (domainInput) {
        domainInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                validateSpfRecord();
            }
        });
    }
} 