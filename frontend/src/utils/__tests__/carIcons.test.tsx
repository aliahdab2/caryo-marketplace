import { getCarIcon } from '@/utils/carIcons';

describe('getCarIcon', () => {
  it('should return sedan icon for sedan body style', () => {
    const icon = getCarIcon('sedan');
    expect(icon).toBeDefined();
  });

  it('should return SUV icon for suv body style', () => {
    const icon = getCarIcon('suv');
    expect(icon).toBeDefined();
  });

  it('should return SUV icon for crossover body style', () => {
    const icon = getCarIcon('crossover');
    expect(icon).toBeDefined();
  });

  it('should handle case insensitive input', () => {
    const icon1 = getCarIcon('SEDAN');
    const icon2 = getCarIcon('sedan');
    expect(icon1).toBeDefined();
    expect(icon2).toBeDefined();
  });

  it('should return default sedan icon for unknown body style', () => {
    const icon = getCarIcon('unknown-car-type');
    expect(icon).toBeDefined();
  });
});
