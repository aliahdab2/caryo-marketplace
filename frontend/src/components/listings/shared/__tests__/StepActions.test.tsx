import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StepActions from '../StepActions';

const rtlSpacing = {
  mr: (v: string) => (v === '2' ? 'mr-2' : ''),
  ml: (v: string) => (v === '2' ? 'ml-2' : ''),
};

describe('StepActions', () => {
  it('renders prev disabled on first step and next visible when not last', () => {
    const onPrev = jest.fn();
    const onNext = jest.fn();
    render(
      <StepActions
        isFirstStep
        isLastStep={false}
        isSubmitting={false}
        onPrev={onPrev}
        onNext={onNext}
        submitButtonText={'Submit'}
        previousText={'Previous'}
        nextText={'Next'}
        leftArrowPath={'M10 19l-7-7 7-7'}
        rightArrowPath={'M14 5l7 7-7 7'}
        rtlSpacing={rtlSpacing}
      />
    );
    const prev = screen.getByText('Previous').closest('button')!;
    const next = screen.getByText('Next').closest('button')!;
    expect(prev).toBeDisabled();
    expect(next).toBeEnabled();
    fireEvent.click(next);
    expect(onNext).toHaveBeenCalled();
  });

  it('renders submit button when last step and shows spinner when submitting', () => {
    const onPrev = jest.fn();
    const onNext = jest.fn();
    const { rerender } = render(
      <StepActions
        isFirstStep={false}
        isLastStep
        isSubmitting={false}
        onPrev={onPrev}
        onNext={onNext}
        submitButtonText={'Create Listing'}
        previousText={'Previous'}
        nextText={'Next'}
        leftArrowPath={'M10 19l-7-7 7-7'}
        rightArrowPath={'M14 5l7 7-7 7'}
        rtlSpacing={rtlSpacing}
      />
    );
    expect(screen.getByText('Create Listing')).toBeInTheDocument();

    rerender(
      <StepActions
        isFirstStep={false}
        isLastStep
        isSubmitting
        onPrev={onPrev}
        onNext={onNext}
        submitButtonText={'Create Listing'}
        previousText={'Previous'}
        nextText={'Next'}
        leftArrowPath={'M10 19l-7-7 7-7'}
        rightArrowPath={'M14 5l7 7-7 7'}
        rtlSpacing={rtlSpacing}
      />
    );
    const buttons = screen.getAllByRole('button');
    const submitBtn = buttons.find((b) => b.type === 'submit') as HTMLButtonElement;
    expect(submitBtn).toBeTruthy();
    const spinner = submitBtn.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });
});


