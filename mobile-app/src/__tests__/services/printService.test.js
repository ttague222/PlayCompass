/**
 * Tests for Print Service
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import printService from '../../services/printService';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('printService', () => {
  const mockActivity = {
    id: 'activity-1',
    name: 'Fun Painting Activity',
    description: 'Create beautiful paintings with watercolors',
    category: 'creative',
    duration: 45,
    ageRange: '4-10 years',
    location: 'indoor',
    materials: ['Watercolors', 'Brushes', 'Paper', 'Water cup'],
    instructions: [
      { title: 'Setup', description: 'Prepare your workspace with newspaper' },
      { title: 'Mix Colors', description: 'Wet your brush and pick up some paint' },
      { title: 'Create', description: 'Let your creativity flow on the paper' },
    ],
    tips: [
      'Start with lighter colors first',
      'Let layers dry before adding more paint',
    ],
    variations: [
      { name: 'Salt technique', description: 'Sprinkle salt for texture effects' },
      { name: 'Wet-on-wet', description: 'Paint on already wet paper for blending' },
    ],
  };

  describe('generateActivityKitPDF', () => {
    it('should generate a PDF file', async () => {
      Print.printToFileAsync.mockResolvedValueOnce({ uri: 'file://temp/document.pdf' });
      FileSystem.moveAsync.mockResolvedValueOnce();

      const result = await printService.generateActivityKitPDF(mockActivity);

      expect(result.success).toBe(true);
      expect(result.uri).toBeDefined();
      expect(result.fileName).toContain('activity_kit.pdf');
    });

    it('should call printToFileAsync with HTML', async () => {
      Print.printToFileAsync.mockResolvedValueOnce({ uri: 'file://temp/document.pdf' });
      FileSystem.moveAsync.mockResolvedValueOnce();

      await printService.generateActivityKitPDF(mockActivity);

      expect(Print.printToFileAsync).toHaveBeenCalled();
      const htmlArg = Print.printToFileAsync.mock.calls[0][0].html;
      expect(htmlArg).toContain(mockActivity.name);
    });

    it('should include materials when option is true', async () => {
      Print.printToFileAsync.mockResolvedValueOnce({ uri: 'file://temp/document.pdf' });
      FileSystem.moveAsync.mockResolvedValueOnce();

      await printService.generateActivityKitPDF(mockActivity, { includeMaterials: true });

      const htmlArg = Print.printToFileAsync.mock.calls[0][0].html;
      expect(htmlArg).toContain('Materials Needed');
      expect(htmlArg).toContain('Watercolors');
    });

    it('should include instructions when option is true', async () => {
      Print.printToFileAsync.mockResolvedValueOnce({ uri: 'file://temp/document.pdf' });
      FileSystem.moveAsync.mockResolvedValueOnce();

      await printService.generateActivityKitPDF(mockActivity, { includeInstructions: true });

      const htmlArg = Print.printToFileAsync.mock.calls[0][0].html;
      expect(htmlArg).toContain('Step-by-Step Instructions');
      expect(htmlArg).toContain('Setup');
    });

    it('should include tips when option is true', async () => {
      Print.printToFileAsync.mockResolvedValueOnce({ uri: 'file://temp/document.pdf' });
      FileSystem.moveAsync.mockResolvedValueOnce();

      await printService.generateActivityKitPDF(mockActivity, { includeTips: true });

      const htmlArg = Print.printToFileAsync.mock.calls[0][0].html;
      expect(htmlArg).toContain('Pro Tips');
    });

    it('should include variations when option is true', async () => {
      Print.printToFileAsync.mockResolvedValueOnce({ uri: 'file://temp/document.pdf' });
      FileSystem.moveAsync.mockResolvedValueOnce();

      await printService.generateActivityKitPDF(mockActivity, { includeVariations: true });

      const htmlArg = Print.printToFileAsync.mock.calls[0][0].html;
      expect(htmlArg).toContain('Creative Variations');
      expect(htmlArg).toContain('Salt technique');
    });

    it('should handle errors gracefully', async () => {
      Print.printToFileAsync.mockRejectedValueOnce(new Error('Print failed'));

      const result = await printService.generateActivityKitPDF(mockActivity);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Print failed');
    });
  });

  describe('shareActivityKitPDF', () => {
    it('should generate and share PDF', async () => {
      Print.printToFileAsync.mockResolvedValueOnce({ uri: 'file://temp/document.pdf' });
      FileSystem.moveAsync.mockResolvedValueOnce();
      Sharing.isAvailableAsync.mockResolvedValueOnce(true);
      Sharing.shareAsync.mockResolvedValueOnce();

      const result = await printService.shareActivityKitPDF(mockActivity);

      expect(result.success).toBe(true);
      expect(Sharing.shareAsync).toHaveBeenCalled();
    });

    it('should fail if sharing is not available', async () => {
      Print.printToFileAsync.mockResolvedValueOnce({ uri: 'file://temp/document.pdf' });
      FileSystem.moveAsync.mockResolvedValueOnce();
      Sharing.isAvailableAsync.mockResolvedValueOnce(false);

      const result = await printService.shareActivityKitPDF(mockActivity);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not available');
    });

    it('should pass correct mime type to share', async () => {
      Print.printToFileAsync.mockResolvedValueOnce({ uri: 'file://temp/document.pdf' });
      FileSystem.moveAsync.mockResolvedValueOnce();
      Sharing.isAvailableAsync.mockResolvedValueOnce(true);
      Sharing.shareAsync.mockResolvedValueOnce();

      await printService.shareActivityKitPDF(mockActivity);

      const shareOptions = Sharing.shareAsync.mock.calls[0][1];
      expect(shareOptions.mimeType).toBe('application/pdf');
    });
  });

  describe('printActivityKit', () => {
    it('should print activity kit directly', async () => {
      Print.printAsync.mockResolvedValueOnce();

      const result = await printService.printActivityKit(mockActivity);

      expect(result.success).toBe(true);
      expect(Print.printAsync).toHaveBeenCalled();
    });

    it('should pass HTML to print', async () => {
      Print.printAsync.mockResolvedValueOnce();

      await printService.printActivityKit(mockActivity);

      const printOptions = Print.printAsync.mock.calls[0][0];
      expect(printOptions.html).toContain(mockActivity.name);
    });

    it('should handle print errors', async () => {
      Print.printAsync.mockRejectedValueOnce(new Error('Printer not found'));

      const result = await printService.printActivityKit(mockActivity);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Printer not found');
    });
  });

  describe('generateWeeklyPlanPDF', () => {
    const mockActivities = [
      { name: 'Monday Activity', dayIndex: 0, time: '10:00 AM' },
      { name: 'Wednesday Activity', dayIndex: 2, time: '2:00 PM' },
      { name: 'Friday Activity', dayIndex: 4, time: '11:00 AM' },
    ];

    it('should generate weekly plan PDF', async () => {
      Print.printToFileAsync.mockResolvedValueOnce({ uri: 'file://temp/weekly.pdf' });
      FileSystem.moveAsync.mockResolvedValueOnce();

      const result = await printService.generateWeeklyPlanPDF(mockActivities, 'Jan 13, 2025');

      expect(result.success).toBe(true);
      expect(result.fileName).toContain('weekly_plan');
    });

    it('should include week start date', async () => {
      Print.printToFileAsync.mockResolvedValueOnce({ uri: 'file://temp/weekly.pdf' });
      FileSystem.moveAsync.mockResolvedValueOnce();

      await printService.generateWeeklyPlanPDF(mockActivities, 'Jan 13, 2025');

      const htmlArg = Print.printToFileAsync.mock.calls[0][0].html;
      expect(htmlArg).toContain('Jan 13, 2025');
    });

    it('should include all days of week', async () => {
      Print.printToFileAsync.mockResolvedValueOnce({ uri: 'file://temp/weekly.pdf' });
      FileSystem.moveAsync.mockResolvedValueOnce();

      await printService.generateWeeklyPlanPDF(mockActivities, 'Jan 13, 2025');

      const htmlArg = Print.printToFileAsync.mock.calls[0][0].html;
      expect(htmlArg).toContain('Monday');
      expect(htmlArg).toContain('Tuesday');
      expect(htmlArg).toContain('Wednesday');
      expect(htmlArg).toContain('Thursday');
      expect(htmlArg).toContain('Friday');
      expect(htmlArg).toContain('Saturday');
      expect(htmlArg).toContain('Sunday');
    });
  });

  describe('shareWeeklyPlanPDF', () => {
    const mockActivities = [
      { name: 'Activity 1', dayIndex: 0, time: '10:00 AM' },
    ];

    it('should generate and share weekly plan', async () => {
      Print.printToFileAsync.mockResolvedValueOnce({ uri: 'file://temp/weekly.pdf' });
      FileSystem.moveAsync.mockResolvedValueOnce();
      Sharing.isAvailableAsync.mockResolvedValueOnce(true);
      Sharing.shareAsync.mockResolvedValueOnce();

      const result = await printService.shareWeeklyPlanPDF(mockActivities, 'Jan 13, 2025');

      expect(result.success).toBe(true);
      expect(Sharing.shareAsync).toHaveBeenCalled();
    });
  });

  describe('HTML generation', () => {
    it('should generate valid HTML structure', async () => {
      Print.printToFileAsync.mockResolvedValueOnce({ uri: 'file://temp/document.pdf' });
      FileSystem.moveAsync.mockResolvedValueOnce();

      await printService.generateActivityKitPDF(mockActivity);

      const htmlArg = Print.printToFileAsync.mock.calls[0][0].html;
      expect(htmlArg).toContain('<!DOCTYPE html>');
      expect(htmlArg).toContain('<html>');
      expect(htmlArg).toContain('</html>');
      expect(htmlArg).toContain('<head>');
      expect(htmlArg).toContain('<body>');
    });

    it('should include PlayCompass branding', async () => {
      Print.printToFileAsync.mockResolvedValueOnce({ uri: 'file://temp/document.pdf' });
      FileSystem.moveAsync.mockResolvedValueOnce();

      await printService.generateActivityKitPDF(mockActivity);

      const htmlArg = Print.printToFileAsync.mock.calls[0][0].html;
      expect(htmlArg).toContain('PlayCompass');
      expect(htmlArg).toContain('🧭');
    });

    it('should include activity metadata', async () => {
      Print.printToFileAsync.mockResolvedValueOnce({ uri: 'file://temp/document.pdf' });
      FileSystem.moveAsync.mockResolvedValueOnce();

      await printService.generateActivityKitPDF(mockActivity);

      const htmlArg = Print.printToFileAsync.mock.calls[0][0].html;
      expect(htmlArg).toContain('45 min');
      expect(htmlArg).toContain('creative');
      expect(htmlArg).toContain('4-10 years');
    });

    it('should include checklist section', async () => {
      Print.printToFileAsync.mockResolvedValueOnce({ uri: 'file://temp/document.pdf' });
      FileSystem.moveAsync.mockResolvedValueOnce();

      await printService.generateActivityKitPDF(mockActivity);

      const htmlArg = Print.printToFileAsync.mock.calls[0][0].html;
      expect(htmlArg).toContain('Activity Checklist');
      expect(htmlArg).toContain('Materials gathered');
      expect(htmlArg).toContain('Activity completed');
    });
  });
});
