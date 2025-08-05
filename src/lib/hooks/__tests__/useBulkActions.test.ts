import { describe, it, expect, vi } from 'vitest';

import { renderHook, act } from '@testing-library/react';
import { useBulkActions } from '../useBulkActions';

describe('useBulkActions', () => {
  it('processes bulk accept actions correctly', async () => {
    const mockHandleAccept = vi.fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Failed'));
    
    const { result } = renderHook(() => useBulkActions(mockHandleAccept));
    
    await act(async () => {
      await result.current.processBulkAccept(['id1', 'id2']);
    });
    
    expect(mockHandleAccept).toHaveBeenCalledTimes(2);
    expect(mockHandleAccept).toHaveBeenCalledWith('id1');
    expect(mockHandleAccept).toHaveBeenCalledWith('id2');
  });

  it('handles empty candidate list', async () => {
    const mockHandleAccept = vi.fn();
    const { result } = renderHook(() => useBulkActions(mockHandleAccept));
    
    await act(async () => {
      await result.current.processBulkAccept([]);
    });
    
    expect(mockHandleAccept).not.toHaveBeenCalled();
  });
}); 