import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import ModelSelect from '../ModelSelect';
import { CarModel } from '@/types/car';

jest.mock('react-i18next', () => ({ useTranslation: jest.fn() }));
const mockUseTranslation = useTranslation as jest.MockedFunction<typeof useTranslation>;

const models: CarModel[] = [
  { id: 10, name: 'Corolla', slug: 'corolla', displayNameEn: 'Corolla', displayNameAr: 'كورولا', isActive: true, brandId: 1 },
  { id: 11, name: 'Camry', slug: 'camry', displayNameEn: 'Camry', displayNameAr: 'كامري', isActive: true, brandId: 1 },
];

describe('ModelSelect', () => {
  beforeEach(() => {
    const mocked = {
      t: ((k: string, fb?: string) => fb || k) as (k: string, fb?: string) => string,
      i18n: { language: 'en' },
    } as unknown as ReturnType<typeof useTranslation>;
    mockUseTranslation.mockReturnValue(mocked);
  });

  it('is disabled when no brand is selected', () => {
    render(
      <ModelSelect
        value={null}
        onChange={jest.fn()}
        options={models}
        isLoading={false}
        currentLanguage="en"
        selectedMake={null}
      />
    );
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('enables when brand is selected and calls onChange', () => {
    const onChange = jest.fn();
    render(
      <ModelSelect
        value={null}
        onChange={onChange}
        options={models}
        isLoading={false}
        currentLanguage="en"
        selectedMake={1}
      />
    );

    const select = screen.getByRole('combobox');
    expect(select).not.toBeDisabled();
    fireEvent.change(select, { target: { value: '11' } });
    expect(onChange).toHaveBeenCalledWith(11);
  });
});


