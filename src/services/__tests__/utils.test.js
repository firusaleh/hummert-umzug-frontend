// src/services/__tests__/utils.test.js
import utils, {
  dateUtils,
  numberUtils,
  stringUtils,
  arrayUtils,
  objectUtils,
  validationUtils,
  storageUtils
} from '../utils';

describe('Date Utilities', () => {
  describe('formatDate', () => {
    it('should format date to German format', () => {
      const date = new Date('2024-01-15');
      expect(dateUtils.formatDate(date)).toBe('15.01.2024');
    });
    
    it('should handle null/undefined', () => {
      expect(dateUtils.formatDate(null)).toBe('');
      expect(dateUtils.formatDate(undefined)).toBe('');
    });
  });
  
  describe('parseGermanDate', () => {
    it('should parse German date format', () => {
      const date = dateUtils.parseGermanDate('15.01.2024');
      expect(date.getDate()).toBe(15);
      expect(date.getMonth()).toBe(0); // January
      expect(date.getFullYear()).toBe(2024);
    });
    
    it('should handle invalid input', () => {
      expect(dateUtils.parseGermanDate(null)).toBe(null);
      expect(dateUtils.parseGermanDate('')).toBe(null);
    });
  });
  
  describe('formatDateTime', () => {
    it('should format date and time', () => {
      const date = new Date('2024-01-15T14:30:00');
      expect(dateUtils.formatDateTime(date)).toMatch(/15\.01\.2024 \d{2}:\d{2}/);
    });
  });
  
  describe('getRelativeTime', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T12:00:00'));
    });
    
    afterEach(() => {
      jest.useRealTimers();
    });
    
    it('should return "gerade eben" for recent time', () => {
      const date = new Date('2024-01-15T11:59:30');
      expect(dateUtils.getRelativeTime(date)).toBe('gerade eben');
    });
    
    it('should return minutes ago', () => {
      const date = new Date('2024-01-15T11:55:00');
      expect(dateUtils.getRelativeTime(date)).toBe('vor 5 Minuten');
    });
    
    it('should return hours ago', () => {
      const date = new Date('2024-01-15T09:00:00');
      expect(dateUtils.getRelativeTime(date)).toBe('vor 3 Stunden');
    });
    
    it('should return days ago', () => {
      const date = new Date('2024-01-10T12:00:00');
      expect(dateUtils.getRelativeTime(date)).toBe('vor 5 Tagen');
    });
    
    it('should return months ago', () => {
      const date = new Date('2023-10-15T12:00:00');
      expect(dateUtils.getRelativeTime(date)).toBe('vor 3 Monaten');
    });
    
    it('should return years ago', () => {
      const date = new Date('2022-01-15T12:00:00');
      expect(dateUtils.getRelativeTime(date)).toBe('vor 2 Jahren');
    });
  });
  
  describe('getDaysBetween', () => {
    it('should calculate days between dates', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-10');
      expect(dateUtils.getDaysBetween(date1, date2)).toBe(9);
    });
  });
  
  describe('isPast', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15'));
    });
    
    afterEach(() => {
      jest.useRealTimers();
    });
    
    it('should check if date is in past', () => {
      expect(dateUtils.isPast('2024-01-10')).toBe(true);
      expect(dateUtils.isPast('2024-01-20')).toBe(false);
    });
  });
});

describe('Number Utilities', () => {
  describe('formatCurrency', () => {
    it('should format number as EUR currency', () => {
      expect(numberUtils.formatCurrency(1234.56)).toBe('1.234,56 €');
      expect(numberUtils.formatCurrency(1000)).toBe('1.000,00 €');
    });
    
    it('should handle null/undefined', () => {
      expect(numberUtils.formatCurrency(null)).toBe('');
      expect(numberUtils.formatCurrency(undefined)).toBe('');
    });
    
    it('should handle decimals parameter', () => {
      expect(numberUtils.formatCurrency(1234.567, 3)).toBe('1.234,567 €');
    });
  });
  
  describe('formatNumber', () => {
    it('should format number with German locale', () => {
      expect(numberUtils.formatNumber(1234567.89)).toBe('1.234.568');
      expect(numberUtils.formatNumber(1234.5, 2)).toBe('1.234,50');
    });
  });
  
  describe('parseGermanNumber', () => {
    it('should parse German number format', () => {
      expect(numberUtils.parseGermanNumber('1.234,56')).toBe(1234.56);
      expect(numberUtils.parseGermanNumber('1.000')).toBe(1000);
    });
    
    it('should handle empty input', () => {
      expect(numberUtils.parseGermanNumber('')).toBe(0);
      expect(numberUtils.parseGermanNumber(null)).toBe(0);
    });
  });
  
  describe('formatPercentage', () => {
    it('should format percentage', () => {
      expect(numberUtils.formatPercentage(12.345)).toBe('12.3%');
      expect(numberUtils.formatPercentage(50, 0)).toBe('50%');
    });
  });
  
  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(numberUtils.formatFileSize(0)).toBe('0 Bytes');
      expect(numberUtils.formatFileSize(1024)).toBe('1 KB');
      expect(numberUtils.formatFileSize(1048576)).toBe('1 MB');
      expect(numberUtils.formatFileSize(1073741824)).toBe('1 GB');
      expect(numberUtils.formatFileSize(1500)).toBe('1.46 KB');
    });
  });
});

describe('String Utilities', () => {
  describe('truncate', () => {
    it('should truncate long strings', () => {
      const longString = 'This is a very long string that needs to be truncated';
      expect(stringUtils.truncate(longString, 20)).toBe('This is a very lo...');
    });
    
    it('should not truncate short strings', () => {
      const shortString = 'Short';
      expect(stringUtils.truncate(shortString, 20)).toBe('Short');
    });
    
    it('should handle custom suffix', () => {
      const string = 'Truncate me';
      expect(stringUtils.truncate(string, 8, '…')).toBe('Truncat…');
    });
  });
  
  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(stringUtils.capitalize('hello')).toBe('Hello');
      expect(stringUtils.capitalize('WORLD')).toBe('WORLD');
    });
    
    it('should handle empty string', () => {
      expect(stringUtils.capitalize('')).toBe('');
      expect(stringUtils.capitalize(null)).toBe('');
    });
  });
  
  describe('toSlug', () => {
    it('should convert to URL-friendly slug', () => {
      expect(stringUtils.toSlug('Hello World!')).toBe('hello-world');
      expect(stringUtils.toSlug('Über uns')).toBe('ber-uns');
      expect(stringUtils.toSlug('  Multiple   Spaces  ')).toBe('multiple-spaces');
    });
  });
  
  describe('stripHtml', () => {
    it('should remove HTML tags', () => {
      const html = '<p>Hello <strong>World</strong></p>';
      expect(stringUtils.stripHtml(html)).toBe('Hello World');
    });
    
    it('should handle nested tags', () => {
      const html = '<div><p>Nested <span>content</span></p></div>';
      expect(stringUtils.stripHtml(html)).toBe('Nested content');
    });
  });
  
  describe('formatPhone', () => {
    it('should format phone number', () => {
      expect(stringUtils.formatPhone('0301234567')).toBe('030 1234 567');
      expect(stringUtils.formatPhone('+491701234567')).toBe('+49170 1234 567');
    });
  });
  
  describe('validation methods', () => {
    it('should validate email', () => {
      expect(stringUtils.isValidEmail('test@example.com')).toBe(true);
      expect(stringUtils.isValidEmail('invalid.email')).toBe(false);
      expect(stringUtils.isValidEmail('test@')).toBe(false);
    });
    
    it('should validate German phone', () => {
      expect(stringUtils.isValidGermanPhone('+49 170 1234567')).toBe(true);
      expect(stringUtils.isValidGermanPhone('0170 1234567')).toBe(true);
      expect(stringUtils.isValidGermanPhone('1234567')).toBe(false);
    });
    
    it('should validate German postal code', () => {
      expect(stringUtils.isValidGermanPostalCode('12345')).toBe(true);
      expect(stringUtils.isValidGermanPostalCode('1234')).toBe(false);
      expect(stringUtils.isValidGermanPostalCode('123456')).toBe(false);
    });
  });
});

describe('Array Utilities', () => {
  describe('groupBy', () => {
    it('should group array by key', () => {
      const data = [
        { category: 'A', value: 1 },
        { category: 'B', value: 2 },
        { category: 'A', value: 3 }
      ];
      
      const grouped = arrayUtils.groupBy(data, 'category');
      
      expect(grouped).toEqual({
        A: [{ category: 'A', value: 1 }, { category: 'A', value: 3 }],
        B: [{ category: 'B', value: 2 }]
      });
    });
  });
  
  describe('sortBy', () => {
    it('should sort by single key', () => {
      const data = [
        { name: 'Charlie', age: 30 },
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 28 }
      ];
      
      const sorted = arrayUtils.sortBy(data, 'name');
      
      expect(sorted[0].name).toBe('Alice');
      expect(sorted[1].name).toBe('Bob');
      expect(sorted[2].name).toBe('Charlie');
    });
    
    it('should sort by multiple keys', () => {
      const data = [
        { category: 'B', value: 2 },
        { category: 'A', value: 3 },
        { category: 'A', value: 1 }
      ];
      
      const sorted = arrayUtils.sortBy(data, 'category', 'value');
      
      expect(sorted[0]).toEqual({ category: 'A', value: 1 });
      expect(sorted[1]).toEqual({ category: 'A', value: 3 });
      expect(sorted[2]).toEqual({ category: 'B', value: 2 });
    });
    
    it('should sort by function', () => {
      const data = [
        { name: 'Alice', scores: [90, 85] },
        { name: 'Bob', scores: [80, 95] },
        { name: 'Charlie', scores: [85, 85] }
      ];
      
      const sorted = arrayUtils.sortBy(data, item => 
        item.scores.reduce((a, b) => a + b, 0) / item.scores.length
      );
      
      expect(sorted[0].name).toBe('Charlie');
      expect(sorted[1].name).toBe('Alice');
      expect(sorted[2].name).toBe('Bob');
    });
  });
  
  describe('unique', () => {
    it('should remove duplicates', () => {
      const numbers = [1, 2, 2, 3, 3, 3, 4];
      expect(arrayUtils.unique(numbers)).toEqual([1, 2, 3, 4]);
    });
    
    it('should remove duplicates by key', () => {
      const data = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 1, name: 'Alice Duplicate' }
      ];
      
      const unique = arrayUtils.unique(data, 'id');
      
      expect(unique).toHaveLength(2);
      expect(unique[0].name).toBe('Alice');
      expect(unique[1].name).toBe('Bob');
    });
  });
  
  describe('chunk', () => {
    it('should split array into chunks', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const chunks = arrayUtils.chunk(data, 3);
      
      expect(chunks).toEqual([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
      ]);
    });
    
    it('should handle uneven chunks', () => {
      const data = [1, 2, 3, 4, 5];
      const chunks = arrayUtils.chunk(data, 2);
      
      expect(chunks).toEqual([
        [1, 2],
        [3, 4],
        [5]
      ]);
    });
  });
  
  describe('findById', () => {
    it('should find item by id or _id', () => {
      const data = [
        { id: 1, name: 'Alice' },
        { _id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' }
      ];
      
      expect(arrayUtils.findById(data, 1)).toEqual({ id: 1, name: 'Alice' });
      expect(arrayUtils.findById(data, 2)).toEqual({ _id: 2, name: 'Bob' });
      expect(arrayUtils.findById(data, 4)).toBeUndefined();
    });
  });
  
  describe('updateItem', () => {
    it('should update item in array', () => {
      const data = [
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 30 }
      ];
      
      const updated = arrayUtils.updateItem(data, 1, { age: 26 });
      
      expect(updated[0].age).toBe(26);
      expect(updated[0].name).toBe('Alice');
      expect(updated[1]).toEqual(data[1]);
    });
  });
  
  describe('removeItem', () => {
    it('should remove item from array', () => {
      const data = [
        { id: 1, name: 'Alice' },
        { _id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' }
      ];
      
      const removed = arrayUtils.removeItem(data, 2);
      
      expect(removed).toHaveLength(2);
      expect(removed.find(item => item.name === 'Bob')).toBeUndefined();
    });
  });
});

describe('Object Utilities', () => {
  describe('deepClone', () => {
    it('should deep clone object', () => {
      const original = {
        a: 1,
        b: { c: 2, d: [3, 4, 5] },
        e: new Date()
      };
      
      const cloned = objectUtils.deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
      expect(cloned.b.d).not.toBe(original.b.d);
    });
  });
  
  describe('deepMerge', () => {
    it('should deep merge objects', () => {
      const target = {
        a: 1,
        b: { c: 2, d: 3 },
        e: [1, 2]
      };
      
      const source = {
        b: { d: 4, f: 5 },
        g: 6
      };
      
      const merged = objectUtils.deepMerge(target, source);
      
      expect(merged).toEqual({
        a: 1,
        b: { c: 2, d: 4, f: 5 },
        e: [1, 2],
        g: 6
      });
    });
  });
  
  describe('pick', () => {
    it('should pick specific keys', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      const picked = objectUtils.pick(obj, ['a', 'c']);
      
      expect(picked).toEqual({ a: 1, c: 3 });
    });
    
    it('should ignore non-existent keys', () => {
      const obj = { a: 1, b: 2 };
      const picked = objectUtils.pick(obj, ['a', 'c']);
      
      expect(picked).toEqual({ a: 1 });
    });
  });
  
  describe('omit', () => {
    it('should omit specific keys', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      const omitted = objectUtils.omit(obj, ['b', 'd']);
      
      expect(omitted).toEqual({ a: 1, c: 3 });
    });
  });
  
  describe('isEmpty', () => {
    it('should check if object is empty', () => {
      expect(objectUtils.isEmpty({})).toBe(true);
      expect(objectUtils.isEmpty({ a: 1 })).toBe(false);
    });
  });
  
  describe('clean', () => {
    it('should remove null and undefined values', () => {
      const obj = {
        a: 1,
        b: null,
        c: undefined,
        d: 0,
        e: '',
        f: false
      };
      
      const cleaned = objectUtils.clean(obj);
      
      expect(cleaned).toEqual({
        a: 1,
        d: 0,
        e: '',
        f: false
      });
    });
  });
});

describe('Validation Utilities', () => {
  describe('required', () => {
    it('should validate required fields', () => {
      expect(validationUtils.required('')).toBe('Dieses Feld ist erforderlich');
      expect(validationUtils.required('  ')).toBe('Dieses Feld ist erforderlich');
      expect(validationUtils.required(null)).toBe('Dieses Feld ist erforderlich');
      expect(validationUtils.required('value')).toBe(null);
    });
    
    it('should use custom message', () => {
      expect(validationUtils.required('', 'Custom error')).toBe('Custom error');
    });
  });
  
  describe('minLength', () => {
    it('should validate minimum length', () => {
      expect(validationUtils.minLength('abc', 5)).toBe('Mindestens 5 Zeichen erforderlich');
      expect(validationUtils.minLength('abcdef', 5)).toBe(null);
      expect(validationUtils.minLength(null, 5)).toBe(null);
    });
  });
  
  describe('maxLength', () => {
    it('should validate maximum length', () => {
      expect(validationUtils.maxLength('abcdef', 5)).toBe('Maximal 5 Zeichen erlaubt');
      expect(validationUtils.maxLength('abc', 5)).toBe(null);
      expect(validationUtils.maxLength(null, 5)).toBe(null);
    });
  });
  
  describe('email', () => {
    it('should validate email addresses', () => {
      expect(validationUtils.email('test@example.com')).toBe(null);
      expect(validationUtils.email('invalid')).toBe('Bitte geben Sie eine gültige E-Mail-Adresse ein');
      expect(validationUtils.email('')).toBe(null);
    });
  });
  
  describe('phone', () => {
    it('should validate German phone numbers', () => {
      expect(validationUtils.phone('+49 170 1234567')).toBe(null);
      expect(validationUtils.phone('invalid')).toBe('Bitte geben Sie eine gültige Telefonnummer ein');
      expect(validationUtils.phone('')).toBe(null);
    });
  });
  
  describe('postalCode', () => {
    it('should validate German postal codes', () => {
      expect(validationUtils.postalCode('12345')).toBe(null);
      expect(validationUtils.postalCode('1234')).toBe('Bitte geben Sie eine gültige Postleitzahl ein');
      expect(validationUtils.postalCode('')).toBe(null);
    });
  });
  
  describe('range', () => {
    it('should validate number range', () => {
      expect(validationUtils.range(5, 1, 10)).toBe(null);
      expect(validationUtils.range(0, 1, 10)).toBe('Wert muss zwischen 1 und 10 liegen');
      expect(validationUtils.range(11, 1, 10)).toBe('Wert muss zwischen 1 und 10 liegen');
      expect(validationUtils.range('abc', 1, 10)).toBe('Wert muss zwischen 1 und 10 liegen');
    });
  });
  
  describe('date', () => {
    it('should validate dates', () => {
      expect(validationUtils.date('2024-01-15')).toBe(null);
      expect(validationUtils.date(new Date())).toBe(null);
      expect(validationUtils.date('invalid')).toBe('Bitte geben Sie ein gültiges Datum ein');
    });
  });
  
  describe('futureDate', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15'));
    });
    
    afterEach(() => {
      jest.useRealTimers();
    });
    
    it('should validate future dates', () => {
      expect(validationUtils.futureDate('2024-01-20')).toBe(null);
      expect(validationUtils.futureDate('2024-01-10')).toBe('Datum muss in der Zukunft liegen');
      expect(validationUtils.futureDate('')).toBe(null);
    });
  });
  
  describe('combine', () => {
    it('should combine multiple validators', () => {
      const validator = validationUtils.combine(
        validationUtils.required,
        value => validationUtils.minLength(value, 3),
        value => validationUtils.maxLength(value, 10)
      );
      
      expect(validator('')).toBe('Dieses Feld ist erforderlich');
      expect(validator('ab')).toBe('Mindestens 3 Zeichen erforderlich');
      expect(validator('abcdefghijk')).toBe('Maximal 10 Zeichen erlaubt');
      expect(validator('valid')).toBe(null);
    });
  });
});

describe('Storage Utilities', () => {
  beforeEach(() => {
    // Clear mocks
    localStorage.clear();
    sessionStorage.clear();
    jest.clearAllMocks();
  });
  
  describe('localStorage', () => {
    it('should get and set values', () => {
      const data = { key: 'value' };
      
      storageUtils.local.set('test', data);
      expect(localStorage.setItem).toHaveBeenCalledWith('test', JSON.stringify(data));
      
      localStorage.getItem.mockReturnValue(JSON.stringify(data));
      const retrieved = storageUtils.local.get('test');
      expect(retrieved).toEqual(data);
    });
    
    it('should handle errors gracefully', () => {
      localStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const result = storageUtils.local.get('test', 'default');
      expect(result).toBe('default');
    });
    
    it('should remove items', () => {
      storageUtils.local.remove('test');
      expect(localStorage.removeItem).toHaveBeenCalledWith('test');
    });
    
    it('should clear storage', () => {
      storageUtils.local.clear();
      expect(localStorage.clear).toHaveBeenCalled();
    });
  });
  
  describe('sessionStorage', () => {
    it('should get and set values', () => {
      const data = { key: 'value' };
      
      storageUtils.session.set('test', data);
      expect(sessionStorage.setItem).toHaveBeenCalledWith('test', JSON.stringify(data));
      
      sessionStorage.getItem.mockReturnValue(JSON.stringify(data));
      const retrieved = storageUtils.session.get('test');
      expect(retrieved).toEqual(data);
    });
    
    it('should handle errors gracefully', () => {
      sessionStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const result = storageUtils.session.get('test', 'default');
      expect(result).toBe('default');
    });
  });
});

describe('Utils default export', () => {
  it('should export all utilities', () => {
    expect(utils.date).toBe(dateUtils);
    expect(utils.number).toBe(numberUtils);
    expect(utils.string).toBe(stringUtils);
    expect(utils.array).toBe(arrayUtils);
    expect(utils.object).toBe(objectUtils);
    expect(utils.validation).toBe(validationUtils);
    expect(utils.storage).toBe(storageUtils);
  });
});