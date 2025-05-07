// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing popup...');
    
    // Get DOM elements
    const profileText = document.getElementById('profileText');
    const parseProfileBtn = document.getElementById('parseProfile');
    const resumeSection = document.getElementById('resume');
    const resumeContent = document.getElementById('resumeContent');
    const downloadResumeBtn = document.getElementById('downloadResume');
    const editProfileBtn = document.getElementById('editProfile');

    // Load saved profile text when popup opens
    chrome.storage.local.get(['lastProfileText'], function(result) {
        if (result.lastProfileText) {
            profileText.value = result.lastProfileText;
        }
    });

    // Function to show error message
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }

    // Function to show success message
    function showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        document.body.appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 3000);
    }

    // Add click handler for parse button
    parseProfileBtn.addEventListener('click', async () => {
        console.log('Parse Profile button clicked');
        const text = profileText.value.trim();
        
        if (!text) {
            showError('Please enter your profile information');
            return;
        }

        try {
            // Save the current input
            chrome.storage.local.set({ 'lastProfileText': text });

            // Disable button and show loading state
            parseProfileBtn.disabled = true;
            parseProfileBtn.textContent = 'Parsing...';
            
            console.log('Sending request to parse profile...');
            const response = await fetch('http://localhost:8001/api/profile/parse-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Origin': 'chrome-extension://' + chrome.runtime.id
                },
                mode: 'cors',
                credentials: 'omit',
                body: JSON.stringify({ profile_text: text })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }

            const parsedProfile = await response.json();
            console.log('Parsed profile:', parsedProfile);
            
            // Display the parsed profile
            resumeContent.innerHTML = `
                <div class="profile-section">
                    <h4>Name</h4>
                    <p>${parsedProfile.name}</p>

                    <h4>Title</h4>
                    <p>${parsedProfile.title}</p>

                    <h4>Professional Summary</h4>
                    <p>${parsedProfile.summary}</p>

                    <h4>Work Experience</h4>
                    <ul>
                        ${parsedProfile.experience.map(exp => `
                            <li>
                                <strong>${exp.title} at ${exp.company}</strong>
                                <br>${exp.duration}
                                <p>${exp.description}</p>
                            </li>
                        `).join('')}
                    </ul>

                    <h4>Education</h4>
                    <ul>
                        ${parsedProfile.education.map(edu => `
                            <li>
                                <strong>${edu.degree}</strong>
                                <br>${edu.institution} (${edu.year})
                            </li>
                        `).join('')}
                    </ul>

                    <h4>Skills</h4>
                    <ul>
                        ${parsedProfile.skills.map(skill => `<li>${skill}</li>`).join('')}
                    </ul>

                    ${parsedProfile.certifications && parsedProfile.certifications.length > 0 ? `
                        <h4>Certifications</h4>
                        <ul>
                            ${parsedProfile.certifications.map(cert => `<li>${cert}</li>`).join('')}
                        </ul>
                    ` : ''}

                    ${parsedProfile.languages && parsedProfile.languages.length > 0 ? `
                        <h4>Languages</h4>
                        <ul>
                            ${parsedProfile.languages.map(lang => `<li>${lang}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
            `;
            
            // Show resume content but keep profile input visible
            resumeSection.classList.remove('hidden');
            showSuccess('Profile parsed successfully! You can edit your input and parse again.');
        } catch (error) {
            console.error('Error parsing profile:', error);
            if (error.message === 'Failed to fetch') {
                showError('Cannot connect to server. Please make sure the server is running at http://localhost:8001');
            } else {
                showError(`Error parsing profile: ${error.message}`);
            }
        } finally {
            // Reset button state
            parseProfileBtn.disabled = false;
            parseProfileBtn.textContent = 'Parse Profile';
        }
    });

    // Add click handler for download button
    downloadResumeBtn.addEventListener('click', () => {
        const content = resumeContent.innerText;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resume.txt';
        a.click();
        URL.revokeObjectURL(url);
        showSuccess('Resume downloaded successfully!');
    });

    // Add click handler for clear data button
    document.getElementById('clearData').addEventListener('click', () => {
        chrome.storage.local.clear(() => {
            profileText.value = '';
            resumeSection.classList.add('hidden');
            showSuccess('All data cleared');
        });
    });

    console.log('Popup initialization complete');
}); 