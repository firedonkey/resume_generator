// Mock Chrome API
const chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  }
};
global.chrome = chrome;

// Mock DOM elements
document.body.innerHTML = `
  <div id="profile-form"></div>
  <div id="profile-preview" class="hidden"></div>
  <textarea id="experience-input"></textarea>
  <button id="parse-profile"></button>
  <button id="edit-profile"></button>
  <div id="parsed-content"></div>
  <div id="jobs-section" class="hidden"></div>
  <div id="job-list"></div>
  <div id="resume-section" class="hidden"></div>
  <div id="resume-list"></div>
  <input type="checkbox" id="local-mode">
  <button id="clear-data"></button>
`;

// Import the functions we want to test
require('../popup.js');

describe('Popup Functionality', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    document.getElementById('experience-input').value = '';
    document.getElementById('profile-form').classList.remove('hidden');
    document.getElementById('profile-preview').classList.add('hidden');
  });

  test('should load saved profile on startup', () => {
    const mockProfile = {
      workExperience: ['Test Experience'],
      education: ['Test Education'],
      skills: ['Test Skill'],
      certifications: ['Test Certification']
    };

    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ profile: mockProfile });
    });

    // Trigger DOMContentLoaded
    document.dispatchEvent(new Event('DOMContentLoaded'));

    expect(chrome.storage.local.get).toHaveBeenCalledWith(
      ['profile', 'localMode'],
      expect.any(Function)
    );
  });

  test('should parse profile in local mode', async () => {
    const testInput = `
      Experience
      Test Job 1
      Test Job 2
      Education
      Test University
      Skills
      JavaScript
      Python
      Certifications
      Test Cert
    `;

    document.getElementById('experience-input').value = testInput;
    document.getElementById('local-mode').checked = true;

    // Trigger parse profile
    document.getElementById('parse-profile').click();

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(document.getElementById('profile-preview').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('parsed-content').innerHTML).toContain('Test Job 1');
    expect(document.getElementById('parsed-content').innerHTML).toContain('JavaScript');
  });

  test('should handle profile parsing error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const testInput = 'Invalid input';

    document.getElementById('experience-input').value = testInput;
    document.getElementById('local-mode').checked = false;

    // Mock failed API call
    global.fetch = jest.fn().mockRejectedValue(new Error('API Error'));

    // Trigger parse profile
    document.getElementById('parse-profile').click();

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(consoleSpy).toHaveBeenCalledWith('Error parsing profile:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  test('should clear data when requested', () => {
    // Mock confirm dialog
    global.confirm = jest.fn().mockReturnValue(true);

    // Trigger clear data
    document.getElementById('clear-data').click();

    expect(chrome.storage.local.clear).toHaveBeenCalled();
    expect(document.getElementById('profile-form').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('profile-preview').classList.contains('hidden')).toBe(true);
  });

  test('should handle local mode toggle', () => {
    document.getElementById('local-mode').checked = true;
    document.getElementById('local-mode').dispatchEvent(new Event('change'));

    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      { localMode: true },
      expect.any(Function)
    );
  });
}); 