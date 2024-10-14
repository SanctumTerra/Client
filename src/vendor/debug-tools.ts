import { Logger } from "./Logger";

export function measureExecutionTime(
	target: unknown,
	propertyKey: string,
	descriptor: PropertyDescriptor,
) {
	const originalMethod = descriptor.value;
	descriptor.value = function (...args: unknown[]) {
		const start = performance.now();
		const result = originalMethod.apply(this, args);
		const end = performance.now();
		const duration = end - start;
		if (globalThis.__DEBUG)
			Logger.debug(`${propertyKey} execution time: ${duration.toFixed(2)}ms`);
		return result;
	};
	return descriptor;
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function measureExecutionTimeForFunction<T extends (...args: any[]) => any>(
	target: T
): T {
	return function (this: ThisParameterType<T>, ...args: Parameters<T>): ReturnType<T> {
		const start = performance.now();
		const result = target.apply(this, args);
		const end = performance.now();
		const duration = end - start;
		if (globalThis.__DEBUG)
			Logger.debug(`${target.name} execution time: ${duration.toFixed(2)}ms`);
		return result;
	} as T;
}
