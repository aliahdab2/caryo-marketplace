import React from 'react';
import { render, screen } from '@testing-library/react';
import { SelectWithArrow } from '../SelectWithArrow';

describe('SelectWithArrow', () => {
  it('renders arrow on the right in LTR and on the left in RTL', () => {
    const { rerender } = render(
      <SelectWithArrow data-testid="sel" isRTL={false}>
        <option value="a">A</option>
      </SelectWithArrow>
    );
    const arrow = screen.getByTestId('select-arrow');
    expect(arrow.className).toMatch(/right-0/);
    expect(arrow.className).toMatch(/pr-3/);

    rerender(
      <SelectWithArrow data-testid="sel" isRTL>
        <option value="a">A</option>
      </SelectWithArrow>
    );
    const arrowRTL = screen.getByTestId('select-arrow');
    expect(arrowRTL.className).toMatch(/left-0/);
    expect(arrowRTL.className).toMatch(/pl-3/);
  });

  it('applies side padding based on RTL', () => {
    const { rerender } = render(
      <SelectWithArrow isRTL={false}>
        <option value="a">A</option>
      </SelectWithArrow>
    );
    let select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.className).toMatch(/pr-10/);

    rerender(
      <SelectWithArrow isRTL>
        <option value="a">A</option>
      </SelectWithArrow>
    );
    select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.className).toMatch(/pl-10/);
  });

  it('shows spinner when loading', () => {
    render(
      <SelectWithArrow isLoading>
        <option value="a">A</option>
      </SelectWithArrow>
    );
    const svg = screen.getByTestId('select-arrow').querySelector('svg');
    const cls = svg?.getAttribute('class') || '';
    expect(cls).toMatch(/animate-spin/);
  });
});


