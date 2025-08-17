import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import GovernorateSelect from '../GovernorateSelect';
import type { Governorate } from '@/services/api';

jest.mock('react-i18next', () => ({ useTranslation: jest.fn() }));
const mockUseTranslation = useTranslation as jest.MockedFunction<typeof useTranslation>;

const govs: Governorate[] = [
  { id: 1, slug: 'damascus', displayNameEn: 'Damascus', displayNameAr: 'دمشق' },
  { id: 2, slug: 'aleppo', displayNameEn: 'Aleppo', displayNameAr: 'حلب' },
];

describe('GovernorateSelect', () => {
  beforeEach(() => {
    const mocked = {
      t: ((k: string, fb?: string) => fb || k) as (k: string, fb?: string) => string,
      i18n: { language: 'en' },
    } as unknown as ReturnType<typeof useTranslation>;
    mockUseTranslation.mockReturnValue(mocked);
  });

  it('renders options and handles change', () => {
    const onChange = jest.fn();
    render(
      <GovernorateSelect
        value=""
        onChange={onChange}
        options={govs}
        isLoading={false}
        currentLanguage="en"
      />
    );

    expect(screen.getByText('Damascus')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'aleppo' } });
    expect(onChange).toHaveBeenCalledWith('aleppo');
  });
});


