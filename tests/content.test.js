// Mock Chrome API
const chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn()
    }
  }
};
global.chrome = chrome;

// Mock DOM elements
document.body.innerHTML = `
  <div data-job-id="1">
    <div data-job-title>Software Engineer</div>
    <div data-company-name>Google</div>
    <div data-job-description>
      Looking for a software engineer with experience in Python, JavaScript, and React.
      Must have strong problem-solving skills and experience with cloud platforms.
    </div>
  </div>
  <div data-job-id="2">
    <div data-job-title>Data Scientist</div>
    <div data-company-name>Google</div>
    <div data-job-description>
      Seeking a data scientist with experience in machine learning and Python.
      Must have experience with TensorFlow and data analysis.
    </div>
  </div>
`;

// Import the content script
require('../content.js');

describe('Content Script Functionality', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  test('should extract jobs from page', () => {
    // Simulate message from popup
    const mockSendResponse = jest.fn();
    const messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
    
    messageListener({ action: 'getJobs' }, {}, mockSendResponse);

    expect(mockSendResponse).toHaveBeenCalledWith({
      jobs: expect.arrayContaining([
        expect.objectContaining({
          id: '1',
          title: 'Software Engineer',
          company: 'Google',
          matchScore: expect.any(Number)
        }),
        expect.objectContaining({
          id: '2',
          title: 'Data Scientist',
          company: 'Google',
          matchScore: expect.any(Number)
        })
      ])
    });
  });

  test('should calculate match scores correctly', () => {
    const jobElements = document.querySelectorAll('[data-job-id]');
    const jobs = Array.from(jobElements).map(element => ({
      id: element.getAttribute('data-job-id'),
      title: element.querySelector('[data-job-title]').textContent.trim(),
      company: element.querySelector('[data-company-name]').textContent.trim(),
      description: element.querySelector('[data-job-description]').textContent.trim()
    }));

    // Software Engineer job should have higher score for Python, JavaScript, React
    const softwareEngineerJob = jobs.find(job => job.title === 'Software Engineer');
    const dataScientistJob = jobs.find(job => job.title === 'Data Scientist');

    expect(softwareEngineerJob.matchScore).toBeGreaterThan(0);
    expect(dataScientistJob.matchScore).toBeGreaterThan(0);
  });

  test('should highlight matching jobs', () => {
    // Simulate page load
    window.dispatchEvent(new Event('load'));

    const jobElements = document.querySelectorAll('[data-job-id]');
    jobElements.forEach(element => {
      const scoreElement = element.querySelector('.resume-generator-match-score');
      expect(scoreElement).toBeTruthy();
      expect(scoreElement.textContent).toMatch(/\d+% Match/);
    });
  });

  test('should handle missing job elements gracefully', () => {
    // Clear the DOM
    document.body.innerHTML = '';

    // Simulate message from popup
    const mockSendResponse = jest.fn();
    const messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
    
    messageListener({ action: 'getJobs' }, {}, mockSendResponse);

    expect(mockSendResponse).toHaveBeenCalledWith({
      jobs: []
    });
  });
}); 