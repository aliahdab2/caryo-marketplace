import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StepNavigation, { StepNavigationItem } from '../StepNavigation';

describe('StepNavigation', () => {
  const items: StepNavigationItem[] = [
    { step: 1, title: 'Step One', icon: '1️⃣', isComplete: true, completionStatus: 'complete' as const },
    { step: 2, title: 'Step Two', icon: '2️⃣', isComplete: false, completionStatus: 'incomplete' as const },
    { step: 3, title: 'Step Three', icon: '3️⃣', isComplete: false, completionStatus: 'not-started' as const },
  ];

  it('renders steps, progress and handles step change', () => {
    const onStepChange = jest.fn();
    const { container } = render(
      <StepNavigation
        items={items}
        currentStep={2}
        onStepChange={onStepChange}
        progressPercentage={50}
        showAutoSaveIndicator={false}
        stepCounterText={'Step 2 of 3'}
        percentCompleteText={'50% Complete'}
      />
    );

    // Renders titles
    expect(screen.getByText('Step One')).toBeInTheDocument();
    expect(screen.getByText('Step Two')).toBeInTheDocument();
    expect(screen.getByText('Step Three')).toBeInTheDocument();

    // Renders counters
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
    expect(screen.getByText('50% Complete')).toBeInTheDocument();

    // Progress bar width
    const bar = container.querySelector('.bg-gradient-to-r.from-blue-500.to-purple-600.h-2.rounded-full') as HTMLDivElement | null;
    expect(bar?.style.width).toBe('50%');

    // Click step buttons
    const buttons = container.querySelectorAll('button');
    fireEvent.click(buttons[0]); // step 1
    fireEvent.click(buttons[1]); // step 2
    expect(onStepChange).toHaveBeenCalledWith(1, expect.any(Object));
    expect(onStepChange).toHaveBeenCalledWith(2, expect.any(Object));
  });
});


