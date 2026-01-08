import * as fs from 'fs';
import * as path from 'path';

/**
 * Generate Manual Test Cases from Automated Tests
 * Converts automated test scripts into manual test case documentation
 */

interface TestCase {
    id: string;
    module: string;
    title: string;
    description: string;
    preconditions: string[];
    steps: string[];
    expectedResults: string[];
    priority: 'High' | 'Medium' | 'Low';
    type: 'Functional' | 'UI' | 'Integration';
}

interface ManualTestSuite {
    module: string;
    totalTests: number;
    testCases: TestCase[];
}

class ManualTestCaseGenerator {
    private testSuites: ManualTestSuite[] = [];
    private testDirectory: string;
    private outputDirectory: string;

    constructor(testDirectory: string, outputDirectory: string) {
        this.testDirectory = testDirectory;
        this.outputDirectory = outputDirectory;
    }

    async run() {
        console.log('📋 Starting manual test case generation...');
        
        // Create output directory
        if (!fs.existsSync(this.outputDirectory)) {
            fs.mkdirSync(this.outputDirectory, { recursive: true });
        }

        // Read all test files
        await this.scanTestFiles();

        // Generate different formats
        this.generateMarkdownFormat();
        this.generateExcelCSVFormat();
        this.generateJiraFormat();
        this.generateTestRailFormat();
        this.generateSummaryReport();

        console.log('✅ Manual test case generation completed!');
        console.log(`📁 Output directory: ${this.outputDirectory}`);
    }

    async scanTestFiles() {
        console.log('🔍 Scanning test files...');
        
        const testFiles = fs.readdirSync(this.testDirectory)
            .filter(file => file.endsWith('.test.ts') || file.endsWith('.spec.ts'));

        for (const file of testFiles) {
            const filePath = path.join(this.testDirectory, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            
            const moduleName = this.extractModuleName(file, content);
            const testCases = this.parseTestCases(content, moduleName, file);

            if (testCases.length > 0) {
                this.testSuites.push({
                    module: moduleName,
                    totalTests: testCases.length,
                    testCases: testCases
                });
                console.log(`  ✅ Parsed ${testCases.length} test cases from ${file}`);
            }
        }

        console.log(`✅ Found ${this.testSuites.length} test suites`);
    }

    extractModuleName(fileName: string, content: string): string {
        // Try to extract from describe block
        const describeMatch = content.match(/test\.describe\(['"](.+?)\s+Tests?['"]/);
        if (describeMatch) {
            return describeMatch[1];
        }

        // Fallback to filename
        return fileName
            .replace('.test.ts', '')
            .replace('.spec.ts', '')
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    parseTestCases(content: string, moduleName: string, fileName: string): TestCase[] {
        const testCases: TestCase[] = [];
        const testRegex = /test\(['"](.+?)['"],\s*async\s*\(\s*{\s*page\s*}\s*\)\s*=>\s*{([\s\S]*?)^\s*}\);/gm;
        
        let match;
        let testIndex = 1;
        
        while ((match = testRegex.exec(content)) !== null) {
            const testTitle = match[1];
            const testBody = match[2];

            const testCase = this.createTestCase(
                moduleName,
                testTitle,
                testBody,
                testIndex,
                fileName
            );

            testCases.push(testCase);
            testIndex++;
        }

        return testCases;
    }

    createTestCase(
        module: string,
        title: string,
        body: string,
        index: number,
        fileName: string
    ): TestCase {
        const steps = this.extractSteps(body);
        const expectedResults = this.extractExpectedResults(body);
        const priority = this.determinePriority(title, body);
        const type = this.determineTestType(title, body);

        return {
            id: `${module.replace(/\s+/g, '-').toUpperCase()}-${index.toString().padStart(3, '0')}`,
            module: module,
            title: title,
            description: this.generateDescription(title, module),
            preconditions: [
                'User must be logged in to the application',
                'User must have appropriate permissions',
                `Navigate to ${module} module`
            ],
            steps: steps,
            expectedResults: expectedResults,
            priority: priority,
            type: type
        };
    }

    extractSteps(body: string): string[] {
        const steps: string[] = [];

        // Extract common actions
        const actions = [
            { pattern: /await.*?\.goto\(['"](.+?)['"]/g, step: (m: RegExpMatchArray) => `Navigate to ${m[1]}` },
            { pattern: /await.*?smartClick\(\[([^\]]+)\]/g, step: (m: RegExpMatchArray) => `Click on element using selectors: ${m[1]}` },
            { pattern: /await.*?\.click\(['"](.+?)['"]/g, step: (m: RegExpMatchArray) => `Click on "${m[1]}"` },
            { pattern: /await.*?click\(\)/g, step: () => `Click the element` },
            { pattern: /await.*?smartFill\(\[([^\]]+)\],\s*['"](.+?)['"]/g, step: (m: RegExpMatchArray) => `Fill in field with "${m[2]}"` },
            { pattern: /await.*?\.fill\(['"](.+?)['"],\s*['"](.+?)['"]/g, step: (m: RegExpMatchArray) => `Fill "${m[1]}" with "${m[2]}"` },
            { pattern: /await.*?waitForStable\(\)/g, step: () => `Wait for page to load completely` },
            { pattern: /await.*?waitForLoadState/g, step: () => `Wait for page to finish loading` },
            { pattern: /await.*?waitForSelector\(['"](.+?)['"]/g, step: (m: RegExpMatchArray) => `Wait for "${m[1]}" to appear` },
            { pattern: /await.*?smartWaitFor\(\[([^\]]+)\]/g, step: (m: RegExpMatchArray) => `Wait for element to appear` },
        ];

        for (const action of actions) {
            let match;
            while ((match = action.pattern.exec(body)) !== null) {
                steps.push(action.step(match));
            }
        }

        // If no steps extracted, add generic ones
        if (steps.length === 0) {
            steps.push('Navigate to the module');
            steps.push('Perform the test action');
            steps.push('Verify the result');
        }

        return this.deduplicateSteps(steps);
    }

    extractExpectedResults(body: string): string[] {
        const results: string[] = [];

        // Extract expectations
        const expectations = [
            { pattern: /expect\(.*?\)\.toBeVisible/g, result: 'Element should be visible on the page' },
            { pattern: /expect\(.*?\)\.toHaveText\(['"](.+?)['"]/g, result: (m: RegExpMatchArray) => `Text should be "${m[1]}"` },
            { pattern: /expect\(.*?\)\.toContainText\(['"](.+?)['"]/g, result: (m: RegExpMatchArray) => `Text should contain "${m[1]}"` },
            { pattern: /expect\(.*?\)\.toBeGreaterThan\((\d+)\)/g, result: (m: RegExpMatchArray) => `Count should be greater than ${m[1]}` },
            { pattern: /expect\(.*?\)\.toBe\(true\)/g, result: 'Condition should be true' },
            { pattern: /expect\(.*?\)\.toHaveURL/g, result: 'URL should match expected pattern' },
            { pattern: /console\.log\(['"]✅(.+?)['"]/g, result: (m: RegExpMatchArray) => m[1].trim() },
        ];

        for (const expectation of expectations) {
            if (typeof expectation.result === 'function') {
                let match;
                while ((match = expectation.pattern.exec(body)) !== null) {
                    results.push(expectation.result(match));
                }
            } else {
                if (expectation.pattern.test(body)) {
                    results.push(expectation.result);
                }
            }
        }

        // Default expected results
        if (results.length === 0) {
            results.push('Test should complete successfully without errors');
            results.push('All elements should be displayed correctly');
        }

        return this.deduplicateSteps(results);
    }

    deduplicateSteps(steps: string[]): string[] {
        return [...new Set(steps)];
    }

    generateDescription(title: string, module: string): string {
        return `Verify that ${title.replace(/^should\s+/i, '')} in the ${module} module works correctly.`;
    }

    determinePriority(title: string, body: string): 'High' | 'Medium' | 'Low' {
        const highPriorityKeywords = ['login', 'access', 'critical', 'essential', 'auth'];
        const lowPriorityKeywords = ['format', 'styling', 'color', 'tooltip'];

        const titleLower = title.toLowerCase();
        
        if (highPriorityKeywords.some(keyword => titleLower.includes(keyword))) {
            return 'High';
        }
        
        if (lowPriorityKeywords.some(keyword => titleLower.includes(keyword))) {
            return 'Low';
        }

        return 'Medium';
    }

    determineTestType(title: string, body: string): 'Functional' | 'UI' | 'Integration' {
        const titleLower = title.toLowerCase();

        if (titleLower.includes('display') || titleLower.includes('visible') || titleLower.includes('format')) {
            return 'UI';
        }

        if (titleLower.includes('workflow') || titleLower.includes('end to end') || titleLower.includes('e2e')) {
            return 'Integration';
        }

        return 'Functional';
    }

    generateMarkdownFormat() {
        console.log('📝 Generating Markdown format...');
        
        let markdown = `# Manual Test Cases\n\n`;
        markdown += `**Generated on:** ${new Date().toISOString()}\n\n`;
        markdown += `**Total Test Suites:** ${this.testSuites.length}\n`;
        markdown += `**Total Test Cases:** ${this.testSuites.reduce((sum, suite) => sum + suite.totalTests, 0)}\n\n`;
        markdown += `---\n\n`;

        for (const suite of this.testSuites) {
            markdown += `## ${suite.module}\n\n`;
            markdown += `**Total Tests:** ${suite.totalTests}\n\n`;

            for (const testCase of suite.testCases) {
                markdown += `### ${testCase.id}: ${testCase.title}\n\n`;
                markdown += `**Priority:** ${testCase.priority} | **Type:** ${testCase.type}\n\n`;
                markdown += `**Description:**\n${testCase.description}\n\n`;
                
                markdown += `**Preconditions:**\n`;
                testCase.preconditions.forEach((pre, i) => {
                    markdown += `${i + 1}. ${pre}\n`;
                });
                markdown += `\n`;

                markdown += `**Test Steps:**\n`;
                testCase.steps.forEach((step, i) => {
                    markdown += `${i + 1}. ${step}\n`;
                });
                markdown += `\n`;

                markdown += `**Expected Results:**\n`;
                testCase.expectedResults.forEach((result, i) => {
                    markdown += `${i + 1}. ${result}\n`;
                });
                markdown += `\n---\n\n`;
            }
        }

        const filePath = path.join(this.outputDirectory, 'manual-test-cases.md');
        fs.writeFileSync(filePath, markdown);
        console.log(`  ✅ Created: ${filePath}`);
    }

    generateExcelCSVFormat() {
        console.log('📊 Generating CSV format (Excel-compatible)...');
        
        let csv = 'Test ID,Module,Test Title,Priority,Type,Description,Preconditions,Test Steps,Expected Results\n';

        for (const suite of this.testSuites) {
            for (const testCase of suite.testCases) {
                const row = [
                    testCase.id,
                    testCase.module,
                    this.escapeCsv(testCase.title),
                    testCase.priority,
                    testCase.type,
                    this.escapeCsv(testCase.description),
                    this.escapeCsv(testCase.preconditions.join('\n')),
                    this.escapeCsv(testCase.steps.join('\n')),
                    this.escapeCsv(testCase.expectedResults.join('\n'))
                ];
                csv += row.join(',') + '\n';
            }
        }

        const filePath = path.join(this.outputDirectory, 'manual-test-cases.csv');
        fs.writeFileSync(filePath, csv);
        console.log(`  ✅ Created: ${filePath}`);
    }

    generateJiraFormat() {
        console.log('🎫 Generating Jira import format...');
        
        let jira = 'Summary,Description,Priority,Issue Type,Labels\n';

        for (const suite of this.testSuites) {
            for (const testCase of suite.testCases) {
                const description = `*Description:*\n${testCase.description}\n\n` +
                    `*Preconditions:*\n${testCase.preconditions.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n` +
                    `*Test Steps:*\n${testCase.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n` +
                    `*Expected Results:*\n${testCase.expectedResults.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;

                const row = [
                    this.escapeCsv(`[${testCase.id}] ${testCase.title}`),
                    this.escapeCsv(description),
                    testCase.priority,
                    'Test',
                    this.escapeCsv(`${testCase.module},${testCase.type},Automated`)
                ];
                jira += row.join(',') + '\n';
            }
        }

        const filePath = path.join(this.outputDirectory, 'jira-import.csv');
        fs.writeFileSync(filePath, jira);
        console.log(`  ✅ Created: ${filePath}`);
    }

    generateTestRailFormat() {
        console.log('🚂 Generating TestRail import format...');
        
        let testRail = 'Section,Test Case ID,Title,Type,Priority,Estimate,References,Automation Type,Preconditions,Steps,Expected Result\n';

        for (const suite of this.testSuites) {
            for (const testCase of suite.testCases) {
                const steps = testCase.steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
                const expectedResults = testCase.expectedResults.map((r, i) => `${i + 1}. ${r}`).join('\n');

                const row = [
                    testCase.module,
                    testCase.id,
                    this.escapeCsv(testCase.title),
                    testCase.type,
                    testCase.priority,
                    '5m',
                    '',
                    'Automated (Playwright)',
                    this.escapeCsv(testCase.preconditions.join('\n')),
                    this.escapeCsv(steps),
                    this.escapeCsv(expectedResults)
                ];
                testRail += row.join(',') + '\n';
            }
        }

        const filePath = path.join(this.outputDirectory, 'testrail-import.csv');
        fs.writeFileSync(filePath, testRail);
        console.log(`  ✅ Created: ${filePath}`);
    }

    generateSummaryReport() {
        console.log('📊 Generating summary report...');
        
        const totalTests = this.testSuites.reduce((sum, suite) => sum + suite.totalTests, 0);
        const byPriority = this.countByPriority();
        const byType = this.countByType();

        let summary = `# Manual Test Cases - Summary Report\n\n`;
        summary += `**Generated on:** ${new Date().toLocaleString()}\n\n`;
        summary += `## Overview\n\n`;
        summary += `- **Total Test Suites:** ${this.testSuites.length}\n`;
        summary += `- **Total Test Cases:** ${totalTests}\n\n`;

        summary += `## By Priority\n\n`;
        summary += `- **High:** ${byPriority.High}\n`;
        summary += `- **Medium:** ${byPriority.Medium}\n`;
        summary += `- **Low:** ${byPriority.Low}\n\n`;

        summary += `## By Type\n\n`;
        summary += `- **Functional:** ${byType.Functional}\n`;
        summary += `- **UI:** ${byType.UI}\n`;
        summary += `- **Integration:** ${byType.Integration}\n\n`;

        summary += `## Test Suites\n\n`;
        summary += `| Module | Test Cases | High | Medium | Low |\n`;
        summary += `|--------|-----------|------|--------|-----|\n`;

        for (const suite of this.testSuites) {
            const high = suite.testCases.filter(tc => tc.priority === 'High').length;
            const medium = suite.testCases.filter(tc => tc.priority === 'Medium').length;
            const low = suite.testCases.filter(tc => tc.priority === 'Low').length;
            
            summary += `| ${suite.module} | ${suite.totalTests} | ${high} | ${medium} | ${low} |\n`;
        }

        summary += `\n## Generated Files\n\n`;
        summary += `1. **manual-test-cases.md** - Complete test cases in Markdown format\n`;
        summary += `2. **manual-test-cases.csv** - Excel-compatible CSV format\n`;
        summary += `3. **jira-import.csv** - Ready to import into Jira\n`;
        summary += `4. **testrail-import.csv** - Ready to import into TestRail\n`;
        summary += `5. **SUMMARY.md** - This summary report\n\n`;

        summary += `## How to Use\n\n`;
        summary += `### Markdown Format (manual-test-cases.md)\n`;
        summary += `- View in any markdown viewer\n`;
        summary += `- Share with team for review\n`;
        summary += `- Convert to PDF if needed\n\n`;

        summary += `### Excel/CSV Format (manual-test-cases.csv)\n`;
        summary += `- Open in Microsoft Excel or Google Sheets\n`;
        summary += `- Filter and sort test cases\n`;
        summary += `- Add execution results columns\n\n`;

        summary += `### Jira Import (jira-import.csv)\n`;
        summary += `1. Go to Jira → Issues → Import\n`;
        summary += `2. Select CSV file\n`;
        summary += `3. Map fields accordingly\n`;
        summary += `4. Import test cases\n\n`;

        summary += `### TestRail Import (testrail-import.csv)\n`;
        summary += `1. Go to TestRail → Test Cases\n`;
        summary += `2. Select Import\n`;
        summary += `3. Choose CSV file\n`;
        summary += `4. Map fields and import\n`;

        const filePath = path.join(this.outputDirectory, 'SUMMARY.md');
        fs.writeFileSync(filePath, summary);
        console.log(`  ✅ Created: ${filePath}`);
    }

    countByPriority() {
        const counts = { High: 0, Medium: 0, Low: 0 };
        for (const suite of this.testSuites) {
            for (const testCase of suite.testCases) {
                counts[testCase.priority]++;
            }
        }
        return counts;
    }

    countByType() {
        const counts = { Functional: 0, UI: 0, Integration: 0 };
        for (const suite of this.testSuites) {
            for (const testCase of suite.testCases) {
                counts[testCase.type]++;
            }
        }
        return counts;
    }

    escapeCsv(text: string): string {
        if (text.includes(',') || text.includes('"') || text.includes('\n')) {
            return `"${text.replace(/"/g, '""')}"`;
        }
        return text;
    }
}

// Main execution
const testDirectory = path.join(process.cwd(), 'tests/auto-generated');
const outputDirectory = path.join(process.cwd(), 'manual-test-cases');

const generator = new ManualTestCaseGenerator(testDirectory, outputDirectory);
generator.run().catch(error => {
    console.error('❌ Error generating manual test cases:', error);
    process.exit(1);
});
