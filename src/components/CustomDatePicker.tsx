import * as React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { useForkRef } from '@mui/material/utils';
import Button, { type ButtonProps } from '@mui/material/Button';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useParsedFormat, usePickerContext } from '@mui/x-date-pickers';

type ButtonFieldOwnProps = Pick<
  ButtonProps,
  'disabled' | 'sx' | 'aria-label' | 'aria-describedby'
> & { id?: string };

/** NOTE: We deliberately accept `any` so unwanted slot props (e.g., inputRef)
 *  can arrive but be **ignored**. We *only* forward the whitelisted ones. */
function ButtonField(incomingProps: ButtonFieldOwnProps & Record<string, unknown>) {
  const {
    id,
    disabled,
    sx,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedby,
    // Intentionally capture and drop field-only props so they DON'T reach the DOM
    inputRef: _dropInputRef,
    slotProps: _dropSlotProps,
    ownerState: _dropOwnerState,
    onKeyDown: _dropOnKeyDown,
    onKeyUp: _dropOnKeyUp,
    onPaste: _dropOnPaste,
    ..._ignoreEverythingElse
  } = incomingProps;

  const picker = usePickerContext();
  const handleRef = useForkRef(picker.triggerRef, picker.rootRef);
  const parsedFormat = useParsedFormat();

  const valueStr =
    picker.value == null ? parsedFormat : picker.value.format(picker.fieldFormat);

  return (
    <Button
      id={id}
      ref={handleRef}
      disabled={disabled}
      variant="outlined"
      size="small"
      startIcon={<CalendarTodayRoundedIcon fontSize="small" />}
      sx={{ minWidth: 'fit-content', ...sx }}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
      onClick={() => picker.setOpen((prev) => !prev)}
    >
      {picker.label ?? valueStr}
    </Button>
  );
}

export default function CustomDatePicker({
  value: controlledValue,
  onChange,
}: {
  value?: Dayjs | null;
  onChange?: (newValue: Dayjs | null) => void;
}) {
  const [internalValue, setInternalValue] = React.useState<Dayjs | null>(dayjs());
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue ?? null : internalValue;

  const handleChange = (newValue: Dayjs | null) => {
    if (!isControlled) setInternalValue(newValue);
    onChange?.(newValue);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        value={value}
        label={value == null ? null : value.format('MMM DD, YYYY')}
        onChange={(newValue) => handleChange(newValue)}
        slots={{ field: ButtonField as any }}
        slotProps={{
          nextIconButton: { size: 'small' },
          previousIconButton: { size: 'small' },
        }}
        views={['day', 'month', 'year']}
      />
    </LocalizationProvider>
  );
}
