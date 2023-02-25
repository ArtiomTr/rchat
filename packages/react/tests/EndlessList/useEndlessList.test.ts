import { renderHook, act } from '@testing-library/react';

import { EndlessListItem, useEndlessList, UseEndlessListConfig } from '../../src/EndlessList/useEndlessList';

const renderEndlessListHook = (initialItems: number[], handleJump?: () => Promise<void>, itemKeys?: Set<string>) => {
	const defaultHookConfig: Omit<UseEndlessListConfig<number>, 'items' | 'visibleItemKeys'> = {
		getKey: (value) => value.toString(),
		compareItems: (a, b) => a - b,
		handleJump: handleJump ?? jest.fn(),
	};

	const emptySet = new Set<string>();

	const hookBag = renderHook(
		({ items, visibleItemKeys }) =>
			useEndlessList({ ...defaultHookConfig, items, visibleItemKeys: visibleItemKeys ?? emptySet }),
		{
			initialProps: {
				items: initialItems,
				visibleItemKeys: itemKeys,
			},
		},
	);

	return hookBag;
};

describe('useEndlessList', () => {
	it('must convert items into EndlessListItem', () => {
		const input = [1, 2, 3];
		const { result } = renderEndlessListHook(input);

		expect(result.current).toStrictEqual([
			{
				array: input,
				index: 0,
				focused: false,
				itemKey: '1',
				type: 'real',
				value: 1,
			},
			{
				array: input,
				index: 1,
				focused: false,
				itemKey: '2',
				type: 'real',
				value: 2,
			},
			{
				array: input,
				index: 2,
				focused: false,
				itemKey: '3',
				type: 'real',
				value: 3,
			},
		] satisfies Array<EndlessListItem<number>>);
	});

	it('must return new array of endless list items after rerender', () => {
		const input = [1, 2, 3];
		const { result, rerender } = renderEndlessListHook(input);

		const secondInput = [2, 3, 4];
		rerender({ items: secondInput, visibleItemKeys: undefined });

		expect(result.current).toStrictEqual([
			{
				array: secondInput,
				index: 0,
				focused: false,
				itemKey: '2',
				type: 'real',
				value: 2,
			},
			{
				array: secondInput,
				index: 1,
				focused: false,
				itemKey: '3',
				type: 'real',
				value: 3,
			},
			{
				array: secondInput,
				index: 2,
				focused: false,
				itemKey: '4',
				type: 'real',
				value: 4,
			},
		] satisfies Array<EndlessListItem<number>>);
	});

	it('must return correct items, during jump', async () => {
		const input = [1, 2, 3];
		let resolveJump!: () => void;
		let rejectJump!: () => void;
		const handleJump = jest.fn().mockImplementation(() => {
			if (rejectJump) {
				rejectJump();
			}

			return new Promise<void>((resolve, reject) => {
				resolveJump = resolve;
				rejectJump = reject;
			});
		});
		const { result, rerender } = renderEndlessListHook(input, handleJump);

		const secondInput = [6, 7, 8];
		rerender({ items: secondInput, visibleItemKeys: undefined });

		expect(result.current).toStrictEqual([
			{
				array: input,
				index: 0,
				focused: false,
				itemKey: '1',
				type: 'real',
				value: 1,
			},
			{
				array: input,
				index: 1,
				focused: false,
				itemKey: '2',
				type: 'real',
				value: 2,
			},
			{
				array: input,
				index: 2,
				focused: false,
				itemKey: '3',
				type: 'real',
				value: 3,
			},
			{
				type: 'placeholder',
				itemKey: ':rchat:-1',
			},
			{
				array: secondInput,
				index: 0,
				focused: false,
				itemKey: '6',
				type: 'real',
				value: 6,
			},
			{
				array: secondInput,
				index: 1,
				focused: true,
				itemKey: '7',
				type: 'real',
				value: 7,
			},
			{
				array: secondInput,
				index: 2,
				focused: false,
				itemKey: '8',
				type: 'real',
				value: 8,
			},
		] satisfies Array<EndlessListItem<number>>);

		await act(async () => {
			resolveJump();

			await Promise.resolve();
		});
	});

	it('must return items in correct order, during jump', async () => {
		const input = [6, 7, 8];
		let resolveJump!: () => void;
		let rejectJump!: () => void;
		const handleJump = jest.fn().mockImplementation(() => {
			if (rejectJump) {
				rejectJump();
			}

			return new Promise<void>((resolve, reject) => {
				resolveJump = resolve;
				rejectJump = reject;
			});
		});
		const { result, rerender } = renderEndlessListHook(input, handleJump);

		const secondInput = [1, 2, 3];
		rerender({ items: secondInput, visibleItemKeys: undefined });

		expect(result.current).toStrictEqual([
			{
				array: secondInput,
				index: 0,
				focused: false,
				itemKey: '1',
				type: 'real',
				value: 1,
			},
			{
				array: secondInput,
				index: 1,
				focused: true,
				itemKey: '2',
				type: 'real',
				value: 2,
			},
			{
				array: secondInput,
				index: 2,
				focused: false,
				itemKey: '3',
				type: 'real',
				value: 3,
			},
			{
				type: 'placeholder',
				itemKey: ':rchat:-1',
			},
			{
				array: input,
				index: 0,
				focused: false,
				itemKey: '6',
				type: 'real',
				value: 6,
			},
			{
				array: input,
				index: 1,
				focused: false,
				itemKey: '7',
				type: 'real',
				value: 7,
			},
			{
				array: input,
				index: 2,
				focused: false,
				itemKey: '8',
				type: 'real',
				value: 8,
			},
		] satisfies Array<EndlessListItem<number>>);

		await act(async () => {
			resolveJump();

			await Promise.resolve();
		});
	});

	it('must abort one jump, and continue performing another', async () => {
		const input = [6, 7, 8];
		let resolveJump!: () => void;
		let rejectJump!: () => void;
		const handleJump = jest.fn().mockImplementation((abortController: AbortController) => {
			if (rejectJump) {
				rejectJump();
			}

			return new Promise<void>((resolve, reject) => {
				resolveJump = resolve;
				rejectJump = reject;
				abortController.signal.addEventListener('abort', reject);
			});
		});
		const { result, rerender } = renderEndlessListHook(input, handleJump);

		const secondInput = [1, 2, 3];
		rerender({ items: secondInput, visibleItemKeys: undefined });
		const thirdInput = [4, 5, 6];
		rerender({ items: thirdInput, visibleItemKeys: new Set(['3']) });

		expect(result.current).toStrictEqual([
			{
				array: secondInput,
				index: 2,
				focused: false,
				itemKey: '3',
				type: 'real',
				value: 3,
			},
			{
				type: 'placeholder',
				itemKey: ':rchat:-2',
			},
			{
				array: thirdInput,
				index: 0,
				focused: false,
				itemKey: '4',
				type: 'real',
				value: 4,
			},
			{
				array: thirdInput,
				index: 1,
				focused: true,
				itemKey: '5',
				type: 'real',
				value: 5,
			},
			{
				array: thirdInput,
				index: 2,
				focused: false,
				itemKey: '6',
				type: 'real',
				value: 6,
			},
		] satisfies Array<EndlessListItem<number>>);

		await act(async () => {
			resolveJump();

			await Promise.resolve();
		});

		expect(result.current).toStrictEqual([
			{
				array: thirdInput,
				index: 0,
				focused: false,
				itemKey: '4',
				type: 'real',
				value: 4,
			},
			{
				array: thirdInput,
				index: 1,
				focused: false,
				itemKey: '5',
				type: 'real',
				value: 5,
			},
			{
				array: thirdInput,
				index: 2,
				focused: false,
				itemKey: '6',
				type: 'real',
				value: 6,
			},
		] satisfies Array<EndlessListItem<number>>);
	});

	it('must not duplicate placeholders, when jump aborted', async () => {
		const input = [6, 7, 8];
		let resolveJump!: () => void;
		let rejectJump!: () => void;
		const handleJump = jest.fn().mockImplementation((abortController: AbortController) => {
			if (rejectJump) {
				rejectJump();
			}

			return new Promise<void>((resolve, reject) => {
				resolveJump = resolve;
				rejectJump = reject;
				abortController.signal.addEventListener('abort', reject);
			});
		});
		const { result, rerender } = renderEndlessListHook(input, handleJump);

		const secondInput = [1, 2, 3];
		rerender({ items: secondInput, visibleItemKeys: undefined });
		const thirdInput = [4, 5, 6];
		rerender({ items: thirdInput, visibleItemKeys: new Set(['3', ':rchat:-1']) });

		expect(result.current).toStrictEqual([
			{
				array: secondInput,
				index: 2,
				focused: false,
				itemKey: '3',
				type: 'real',
				value: 3,
			},
			{
				type: 'placeholder',
				itemKey: ':rchat:-1',
			},
			{
				array: thirdInput,
				index: 0,
				focused: false,
				itemKey: '4',
				type: 'real',
				value: 4,
			},
			{
				array: thirdInput,
				index: 1,
				focused: true,
				itemKey: '5',
				type: 'real',
				value: 5,
			},
			{
				array: thirdInput,
				index: 2,
				focused: false,
				itemKey: '6',
				type: 'real',
				value: 6,
			},
		] satisfies Array<EndlessListItem<number>>);

		await act(async () => {
			resolveJump();

			await Promise.resolve();
		});

		expect(result.current).toStrictEqual([
			{
				array: thirdInput,
				index: 0,
				focused: false,
				itemKey: '4',
				type: 'real',
				value: 4,
			},
			{
				array: thirdInput,
				index: 1,
				focused: false,
				itemKey: '5',
				type: 'real',
				value: 5,
			},
			{
				array: thirdInput,
				index: 2,
				focused: false,
				itemKey: '6',
				type: 'real',
				value: 6,
			},
		] satisfies Array<EndlessListItem<number>>);
	});

	it('must merge incoming and existing items', async () => {
		const input = [6, 7, 8];
		let resolveJump!: () => void;
		let rejectJump!: () => void;
		const handleJump = jest.fn().mockImplementation((abortController: AbortController) => {
			if (rejectJump) {
				rejectJump();
			}

			return new Promise<void>((resolve, reject) => {
				resolveJump = resolve;
				rejectJump = reject;
				abortController.signal.addEventListener('abort', reject);
			});
		});
		const { result, rerender } = renderEndlessListHook(input, handleJump);

		const secondInput = [1, 2, 3];
		rerender({ items: secondInput, visibleItemKeys: undefined });
		const thirdInput = [4, 5, 6];
		rerender({ items: thirdInput, visibleItemKeys: new Set([':rchat:-1', '6', '7', '8']) });

		const mergedInput = [4, 5, 6, 7, 8];

		expect(result.current).toStrictEqual([
			{
				itemKey: ':rchat:-1',
				type: 'placeholder'
			},
			{
				array: mergedInput,
				index: 0,
				focused: false,
				itemKey: '4',
				type: 'real',
				value: 4,
			},
			{
				array: mergedInput,
				index: 1,
				focused: true,
				itemKey: '5',
				type: 'real',
				value: 5,
			},
			{
				array: mergedInput,
				index: 2,
				focused: false,
				itemKey: '6',
				type: 'real',
				value: 6,
			},
			{
				array: mergedInput,
				index: 3,
				focused: false,
				itemKey: '7',
				type: 'real',
				value: 7,
			},
			{
				array: mergedInput,
				index: 4,
				focused: false,
				itemKey: '8',
				type: 'real',
				value: 8,
			},
		] satisfies Array<EndlessListItem<number>>);

		await act(async () => {
			resolveJump();

			await Promise.resolve();
		});

		expect(result.current).toStrictEqual([
			{
				array: thirdInput,
				index: 0,
				focused: false,
				itemKey: '4',
				type: 'real',
				value: 4,
			},
			{
				array: thirdInput,
				index: 1,
				focused: false,
				itemKey: '5',
				type: 'real',
				value: 5,
			},
			{
				array: thirdInput,
				index: 2,
				focused: false,
				itemKey: '6',
				type: 'real',
				value: 6,
			},
		] satisfies Array<EndlessListItem<number>>)
	});

	it('must merge incoming and existing items (array with placeholder)', async () => {
		const input = [6, 7, 8];
		let resolveJump!: () => void;
		let rejectJump!: () => void;
		const handleJump = jest.fn().mockImplementation((abortController: AbortController) => {
			if (rejectJump) {
				rejectJump();
			}

			return new Promise<void>((resolve, reject) => {
				resolveJump = resolve;
				rejectJump = reject;
				abortController.signal.addEventListener('abort', reject);
			});
		});
		const { result, rerender } = renderEndlessListHook(input, handleJump);

		const secondInput = [1, 2, 3];
		rerender({ items: secondInput, visibleItemKeys: undefined });
		const thirdInput = [4, 5, 6];
		rerender({ items: thirdInput, visibleItemKeys: new Set(['2', '3', ':rchat:-1', '6', '7']) });

		const mergedInput = [2, 3];
		const mergedInput2 = [4, 5, 6, 7];

		expect(result.current).toStrictEqual([
			{
				array: mergedInput,
				index: 0,
				focused: false,
				itemKey: '2',
				type: 'real',
				value: 2,
			},
			{
				array: mergedInput,
				index: 1,
				focused: false,
				itemKey: '3',
				type: 'real',
				value: 3,
			},
			{
				itemKey: ':rchat:-1',
				type: 'placeholder'
			},
			{
				array: mergedInput2,
				index: 0,
				focused: false,
				itemKey: '4',
				type: 'real',
				value: 4,
			},
			{
				array: mergedInput2,
				index: 1,
				focused: true,
				itemKey: '5',
				type: 'real',
				value: 5,
			},
			{
				array: mergedInput2,
				index: 2,
				focused: false,
				itemKey: '6',
				type: 'real',
				value: 6,
			},
			{
				array: mergedInput2,
				index: 3,
				focused: false,
				itemKey: '7',
				type: 'real',
				value: 7,
			},
		] satisfies Array<EndlessListItem<number>>);

		await act(async () => {
			resolveJump();

			await Promise.resolve();
		});

		expect(result.current).toStrictEqual([
			{
				array: thirdInput,
				index: 0,
				focused: false,
				itemKey: '4',
				type: 'real',
				value: 4,
			},
			{
				array: thirdInput,
				index: 1,
				focused: false,
				itemKey: '5',
				type: 'real',
				value: 5,
			},
			{
				array: thirdInput,
				index: 2,
				focused: false,
				itemKey: '6',
				type: 'real',
				value: 6,
			},
		] satisfies Array<EndlessListItem<number>>)
	});

	it('must merge incoming and existing items (array with placeholder, correct direction)', async () => {
		const input = [6, 7, 8];
		let resolveJump!: () => void;
		let rejectJump!: () => void;
		const handleJump = jest.fn().mockImplementation((abortController: AbortController) => {
			if (rejectJump) {
				rejectJump();
			}

			return new Promise<void>((resolve, reject) => {
				resolveJump = resolve;
				rejectJump = reject;
				abortController.signal.addEventListener('abort', reject);
			});
		});
		const { result, rerender } = renderEndlessListHook(input, handleJump);

		const secondInput = [1, 2, 3];
		rerender({ items: secondInput, visibleItemKeys: undefined });
		const thirdInput = [3, 4, 5];
		rerender({ items: thirdInput, visibleItemKeys: new Set(['2', '3', ':rchat:-1', '6', '7']) });

		const mergedInput = [2, 3, 4, 5];
		const mergedInput2 = [6, 7];

		expect(result.current).toStrictEqual([
			{
				array: mergedInput,
				index: 0,
				focused: false,
				itemKey: '2',
				type: 'real',
				value: 2,
			},
			{
				array: mergedInput,
				index: 1,
				focused: false,
				itemKey: '3',
				type: 'real',
				value: 3,
			},
			{
				array: mergedInput,
				index: 2,
				focused: true,
				itemKey: '4',
				type: 'real',
				value: 4,
			},
			{
				array: mergedInput,
				index: 3,
				focused: false,
				itemKey: '5',
				type: 'real',
				value: 5,
			},
			{
				itemKey: ':rchat:-1',
				type: 'placeholder'
			},
			{
				array: mergedInput2,
				index: 0,
				focused: false,
				itemKey: '6',
				type: 'real',
				value: 6,
			},
			{
				array: mergedInput2,
				index: 1,
				focused: false,
				itemKey: '7',
				type: 'real',
				value: 7,
			},
		] satisfies Array<EndlessListItem<number>>);

		await act(async () => {
			resolveJump();

			await Promise.resolve();
		});

		expect(result.current).toStrictEqual([
			{
				array: thirdInput,
				index: 0,
				focused: false,
				itemKey: '3',
				type: 'real',
				value: 3,
			},
			{
				array: thirdInput,
				index: 1,
				focused: false,
				itemKey: '4',
				type: 'real',
				value: 4,
			},
			{
				array: thirdInput,
				index: 2,
				focused: false,
				itemKey: '5',
				type: 'real',
				value: 5,
			},
		] satisfies Array<EndlessListItem<number>>)
	});
});