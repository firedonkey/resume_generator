// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing popup...');
    
    // Get DOM elements
    const profileInput = document.getElementById('profileInput');
    const parseProfileBtn = document.getElementById('parseProfile');
    const parsedProfileSection = document.getElementById('parsedProfile');
    const parsedContent = document.getElementById('parsedContent');
    const editProfileBtn = document.getElementById('editProfile');

    console.log('DOM Elements:', {
        profileInput: !!profileInput,
        parseProfileBtn: !!parseProfileBtn,
        parsedProfileSection: !!parsedProfileSection,
        parsedContent: !!parsedContent,
        editProfileBtn: !!editProfileBtn
    });

    // Function to show error message
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }

    // Add click handler for parse button
    parseProfileBtn.addEventListener('click', async () => {
        console.log('Parse Profile button clicked');
        const text = profileInput.value.trim();
        
        if (!text) {
            showError('Please enter your profile information');
            return;
        }

        try {
            // Disable button and show loading state
            parseProfileBtn.disabled = true;
            parseProfileBtn.textContent = 'Parsing...';
            
            console.log('Sending request to parse profile...');
            console.log('Request URL:', 'http://localhost:8001/api/profile/parse-profile');
            console.log('Request body:', { profile_text: text });

            // Call backend API to parse and enhance profile
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

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }

            const parsedProfile = await response.json();
            console.log('Parsed profile:', parsedProfile);
            
            // Display the enhanced profile
            parsedContent.innerHTML = `
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
            
            // Hide profile input, show parsed content
            document.getElementById('profile').classList.add('hidden');
            parsedProfileSection.classList.remove('hidden');
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

    // Add click handler for edit button
    editProfileBtn.addEventListener('click', () => {
        console.log('Edit Profile button clicked');
        // Show profile input, hide parsed content
        parsedProfileSection.classList.add('hidden');
        document.getElementById('profile').classList.remove('hidden');
    });

    console.log('Popup initialization complete');
}); 