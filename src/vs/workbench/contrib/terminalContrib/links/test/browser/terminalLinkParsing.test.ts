/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { deepStrictEqual, ok, strictEqual } from 'assert';
import { OperatingSystem } from 'vs/base/common/platform';
import { detectLinks, detectLinkSuffixes, getLinkSuffix, IParsedLink, removeLinkSuffix } from 'vs/workbench/contrib/terminalContrib/links/browser/terminalLinkParsing';

interface ITestLink {
	link: string;
	prefix: string | undefined;
	suffix: string | undefined;
	hasRow: boolean;
	hasCol: boolean;
}

const testRow = 339;
const testCol = 12;
const testLinks: ITestLink[] = [
	// Simple
	{ link: 'foo', prefix: undefined, suffix: undefined, hasRow: false, hasCol: false },
	{ link: 'foo:339', prefix: undefined, suffix: ':339', hasRow: true, hasCol: false },
	{ link: 'foo:339:12', prefix: undefined, suffix: ':339:12', hasRow: true, hasCol: true },
	{ link: 'foo 339', prefix: undefined, suffix: ' 339', hasRow: true, hasCol: false },
	{ link: 'foo 339:12', prefix: undefined, suffix: ' 339:12', hasRow: true, hasCol: true },

	// Double quotes
	{ link: '"foo",339', prefix: '"', suffix: '",339', hasRow: true, hasCol: false },
	{ link: '"foo",339:12', prefix: '"', suffix: '",339:12', hasRow: true, hasCol: true },
	{ link: '"foo", line 339', prefix: '"', suffix: '", line 339', hasRow: true, hasCol: false },
	{ link: '"foo", line 339, col 12', prefix: '"', suffix: '", line 339, col 12', hasRow: true, hasCol: true },
	{ link: '"foo", line 339, column 12', prefix: '"', suffix: '", line 339, column 12', hasRow: true, hasCol: true },
	{ link: '"foo":line 339', prefix: '"', suffix: '":line 339', hasRow: true, hasCol: false },
	{ link: '"foo":line 339, col 12', prefix: '"', suffix: '":line 339, col 12', hasRow: true, hasCol: true },
	{ link: '"foo":line 339, column 12', prefix: '"', suffix: '":line 339, column 12', hasRow: true, hasCol: true },
	{ link: '"foo": line 339', prefix: '"', suffix: '": line 339', hasRow: true, hasCol: false },
	{ link: '"foo": line 339, col 12', prefix: '"', suffix: '": line 339, col 12', hasRow: true, hasCol: true },
	{ link: '"foo": line 339, column 12', prefix: '"', suffix: '": line 339, column 12', hasRow: true, hasCol: true },
	{ link: '"foo" on line 339', prefix: '"', suffix: '" on line 339', hasRow: true, hasCol: false },
	{ link: '"foo" on line 339, col 12', prefix: '"', suffix: '" on line 339, col 12', hasRow: true, hasCol: true },
	{ link: '"foo" on line 339, column 12', prefix: '"', suffix: '" on line 339, column 12', hasRow: true, hasCol: true },
	{ link: '"foo" line 339', prefix: '"', suffix: '" line 339', hasRow: true, hasCol: false },
	{ link: '"foo" line 339 column 12', prefix: '"', suffix: '" line 339 column 12', hasRow: true, hasCol: true },

	// Single quotes
	{ link: '\'foo\',339', prefix: '\'', suffix: '\',339', hasRow: true, hasCol: false },
	{ link: '\'foo\',339:12', prefix: '\'', suffix: '\',339:12', hasRow: true, hasCol: true },
	{ link: '\'foo\', line 339', prefix: '\'', suffix: '\', line 339', hasRow: true, hasCol: false },
	{ link: '\'foo\', line 339, col 12', prefix: '\'', suffix: '\', line 339, col 12', hasRow: true, hasCol: true },
	{ link: '\'foo\', line 339, column 12', prefix: '\'', suffix: '\', line 339, column 12', hasRow: true, hasCol: true },
	{ link: '\'foo\':line 339', prefix: '\'', suffix: '\':line 339', hasRow: true, hasCol: false },
	{ link: '\'foo\':line 339, col 12', prefix: '\'', suffix: '\':line 339, col 12', hasRow: true, hasCol: true },
	{ link: '\'foo\':line 339, column 12', prefix: '\'', suffix: '\':line 339, column 12', hasRow: true, hasCol: true },
	{ link: '\'foo\': line 339', prefix: '\'', suffix: '\': line 339', hasRow: true, hasCol: false },
	{ link: '\'foo\': line 339, col 12', prefix: '\'', suffix: '\': line 339, col 12', hasRow: true, hasCol: true },
	{ link: '\'foo\': line 339, column 12', prefix: '\'', suffix: '\': line 339, column 12', hasRow: true, hasCol: true },
	{ link: '\'foo\' on line 339', prefix: '\'', suffix: '\' on line 339', hasRow: true, hasCol: false },
	{ link: '\'foo\' on line 339, col 12', prefix: '\'', suffix: '\' on line 339, col 12', hasRow: true, hasCol: true },
	{ link: '\'foo\' on line 339, column 12', prefix: '\'', suffix: '\' on line 339, column 12', hasRow: true, hasCol: true },
	{ link: '\'foo\' line 339', prefix: '\'', suffix: '\' line 339', hasRow: true, hasCol: false },
	{ link: '\'foo\' line 339 column 12', prefix: '\'', suffix: '\' line 339 column 12', hasRow: true, hasCol: true },

	// No quotes
	{ link: 'foo, line 339', prefix: undefined, suffix: ', line 339', hasRow: true, hasCol: false },
	{ link: 'foo, line 339, col 12', prefix: undefined, suffix: ', line 339, col 12', hasRow: true, hasCol: true },
	{ link: 'foo, line 339, column 12', prefix: undefined, suffix: ', line 339, column 12', hasRow: true, hasCol: true },
	{ link: 'foo:line 339', prefix: undefined, suffix: ':line 339', hasRow: true, hasCol: false },
	{ link: 'foo:line 339, col 12', prefix: undefined, suffix: ':line 339, col 12', hasRow: true, hasCol: true },
	{ link: 'foo:line 339, column 12', prefix: undefined, suffix: ':line 339, column 12', hasRow: true, hasCol: true },
	{ link: 'foo: line 339', prefix: undefined, suffix: ': line 339', hasRow: true, hasCol: false },
	{ link: 'foo: line 339, col 12', prefix: undefined, suffix: ': line 339, col 12', hasRow: true, hasCol: true },
	{ link: 'foo: line 339, column 12', prefix: undefined, suffix: ': line 339, column 12', hasRow: true, hasCol: true },
	{ link: 'foo on line 339', prefix: undefined, suffix: ' on line 339', hasRow: true, hasCol: false },
	{ link: 'foo on line 339, col 12', prefix: undefined, suffix: ' on line 339, col 12', hasRow: true, hasCol: true },
	{ link: 'foo on line 339, column 12', prefix: undefined, suffix: ' on line 339, column 12', hasRow: true, hasCol: true },
	{ link: 'foo line 339', prefix: undefined, suffix: ' line 339', hasRow: true, hasCol: false },
	{ link: 'foo line 339 column 12', prefix: undefined, suffix: ' line 339 column 12', hasRow: true, hasCol: true },

	// Parentheses
	{ link: 'foo(339)', prefix: undefined, suffix: '(339)', hasRow: true, hasCol: false },
	{ link: 'foo(339,12)', prefix: undefined, suffix: '(339,12)', hasRow: true, hasCol: true },
	{ link: 'foo(339, 12)', prefix: undefined, suffix: '(339, 12)', hasRow: true, hasCol: true },
	{ link: 'foo (339)', prefix: undefined, suffix: ' (339)', hasRow: true, hasCol: false },
	{ link: 'foo (339,12)', prefix: undefined, suffix: ' (339,12)', hasRow: true, hasCol: true },
	{ link: 'foo (339, 12)', prefix: undefined, suffix: ' (339, 12)', hasRow: true, hasCol: true },
	{ link: 'foo: (339)', prefix: undefined, suffix: ': (339)', hasRow: true, hasCol: false },
	{ link: 'foo: (339,12)', prefix: undefined, suffix: ': (339,12)', hasRow: true, hasCol: true },
	{ link: 'foo: (339, 12)', prefix: undefined, suffix: ': (339, 12)', hasRow: true, hasCol: true },

	// Square brackets
	{ link: 'foo[339]', prefix: undefined, suffix: '[339]', hasRow: true, hasCol: false },
	{ link: 'foo[339,12]', prefix: undefined, suffix: '[339,12]', hasRow: true, hasCol: true },
	{ link: 'foo[339, 12]', prefix: undefined, suffix: '[339, 12]', hasRow: true, hasCol: true },
	{ link: 'foo [339]', prefix: undefined, suffix: ' [339]', hasRow: true, hasCol: false },
	{ link: 'foo [339,12]', prefix: undefined, suffix: ' [339,12]', hasRow: true, hasCol: true },
	{ link: 'foo [339, 12]', prefix: undefined, suffix: ' [339, 12]', hasRow: true, hasCol: true },
	{ link: 'foo: [339]', prefix: undefined, suffix: ': [339]', hasRow: true, hasCol: false },
	{ link: 'foo: [339,12]', prefix: undefined, suffix: ': [339,12]', hasRow: true, hasCol: true },
	{ link: 'foo: [339, 12]', prefix: undefined, suffix: ': [339, 12]', hasRow: true, hasCol: true },

	// Non-breaking space
	{ link: 'foo\u00A0339:12', prefix: undefined, suffix: '\u00A0339:12', hasRow: true, hasCol: true },
	{ link: '"foo" on line 339,\u00A0column 12', prefix: '"', suffix: '" on line 339,\u00A0column 12', hasRow: true, hasCol: true },
	{ link: '\'foo\' on line\u00A0339, column 12', prefix: '\'', suffix: '\' on line\u00A0339, column 12', hasRow: true, hasCol: true },
	{ link: 'foo (339,\u00A012)', prefix: undefined, suffix: ' (339,\u00A012)', hasRow: true, hasCol: true },
	{ link: 'foo\u00A0[339, 12]', prefix: undefined, suffix: '\u00A0[339, 12]', hasRow: true, hasCol: true },
];
const testLinksWithSuffix = testLinks.filter(e => !!e.suffix);

suite('TerminalLinkParsing', () => {
	suite('removeLinkSuffix', () => {
		for (const testLink of testLinks) {
			test('`' + testLink.link + '`', () => {
				deepStrictEqual(
					removeLinkSuffix(testLink.link),
					testLink.suffix === undefined ? testLink.link : testLink.link.replace(testLink.suffix, '')
				);
			});
		}
	});
	suite('getLinkSuffix', () => {
		for (const testLink of testLinks) {
			test('`' + testLink.link + '`', () => {
				deepStrictEqual(
					getLinkSuffix(testLink.link),
					testLink.suffix === undefined ? null : {
						row: testLink.hasRow ? testRow : undefined,
						col: testLink.hasCol ? testCol : undefined,
						suffix: {
							index: testLink.link.length - testLink.suffix.length,
							text: testLink.suffix
						}
					} as ReturnType<typeof getLinkSuffix>
				);
			});
		}
	});
	suite('detectLinkSuffixes', () => {
		for (const testLink of testLinks) {
			test('`' + testLink.link + '`', () => {
				deepStrictEqual(
					detectLinkSuffixes(testLink.link),
					testLink.suffix === undefined ? [] : [{
						row: testLink.hasRow ? testRow : undefined,
						col: testLink.hasCol ? testCol : undefined,
						suffix: {
							index: testLink.link.length - testLink.suffix.length,
							text: testLink.suffix
						}
					} as ReturnType<typeof getLinkSuffix>]
				);
			});
		}

		test('foo(1, 2) bar[3, 4] baz on line 5', () => {
			deepStrictEqual(
				detectLinkSuffixes('foo(1, 2) bar[3, 4] baz on line 5'),
				[
					{
						col: 2,
						row: 1,
						suffix: {
							index: 3,
							text: '(1, 2)'
						}
					},
					{
						col: 4,
						row: 3,
						suffix: {
							index: 13,
							text: '[3, 4]'
						}
					},
					{
						col: undefined,
						row: 5,
						suffix: {
							index: 23,
							text: ' on line 5'
						}
					}
				]
			);
		});
	});
	suite('detectLinks', () => {
		test('foo(1, 2) bar[3, 4] "baz" on line 5', () => {
			deepStrictEqual(
				detectLinks('foo(1, 2) bar[3, 4] "baz" on line 5', OperatingSystem.Linux),
				[
					{
						path: {
							index: 0,
							text: 'foo'
						},
						prefix: undefined,
						suffix: {
							col: 2,
							row: 1,
							suffix: {
								index: 3,
								text: '(1, 2)'
							}
						}
					},
					{
						path: {
							index: 10,
							text: 'bar'
						},
						prefix: undefined,
						suffix: {
							col: 4,
							row: 3,
							suffix: {
								index: 13,
								text: '[3, 4]'
							}
						}
					},
					{
						path: {
							index: 21,
							text: 'baz'
						},
						prefix: {
							index: 20,
							text: '"'
						},
						suffix: {
							col: undefined,
							row: 5,
							suffix: {
								index: 24,
								text: '" on line 5'
							}
						}
					}
				] as IParsedLink[]
			);
		});

		test('should extract the link prefix', () => {
			deepStrictEqual(
				detectLinks('"foo", line 5, col 6', OperatingSystem.Linux),
				[
					{
						path: {
							index: 1,
							text: 'foo'
						},
						prefix: {
							index: 0,
							text: '"',
						},
						suffix: {
							row: 5,
							col: 6,
							suffix: {
								index: 4,
								text: '", line 5, col 6'
							}
						}
					},
				] as IParsedLink[]
			);
		});

		test('should be smart about determining the link prefix when multiple prefix characters exist', () => {
			deepStrictEqual(
				detectLinks('echo \'"foo", line 5, col 6\'', OperatingSystem.Linux),
				[
					{
						path: {
							index: 7,
							text: 'foo'
						},
						prefix: {
							index: 6,
							text: '"',
						},
						suffix: {
							row: 5,
							col: 6,
							suffix: {
								index: 10,
								text: '", line 5, col 6'
							}
						}
					},
				] as IParsedLink[],
				'The outer single quotes should be excluded from the link prefix and suffix'
			);
		});

		test('should detect both suffix and non-suffix links on a single line', () => {
			deepStrictEqual(
				detectLinks('PS C:\\Github\\microsoft\\vscode> echo \'"foo", line 5, col 6\'', OperatingSystem.Windows),
				[
					{
						path: {
							index: 3,
							text: 'C:\\Github\\microsoft\\vscode'
						},
						prefix: undefined,
						suffix: undefined
					},
					{
						path: {
							index: 38,
							text: 'foo'
						},
						prefix: {
							index: 37,
							text: '"',
						},
						suffix: {
							row: 5,
							col: 6,
							suffix: {
								index: 41,
								text: '", line 5, col 6'
							}
						}
					}
				] as IParsedLink[]
			);
		});

		test('should exclude pipe characters from link paths', () => {
			deepStrictEqual(
				detectLinks('|C:\\Github\\microsoft\\vscode|', OperatingSystem.Windows),
				[
					{
						path: {
							index: 1,
							text: 'C:\\Github\\microsoft\\vscode'
						},
						prefix: undefined,
						suffix: undefined
					}
				] as IParsedLink[]
			);
		});

		test('should exclude pipe characters from link paths with suffixes', () => {
			deepStrictEqual(
				detectLinks('|C:\\Github\\microsoft\\vscode:400|', OperatingSystem.Windows),
				[
					{
						path: {
							index: 1,
							text: 'C:\\Github\\microsoft\\vscode'
						},
						prefix: undefined,
						suffix: {
							col: undefined,
							row: 400,
							suffix: {
								index: 27,
								text: ':400'
							}
						}
					}
				] as IParsedLink[]
			);
		});

		suite('should detect file names in git diffs', () => {
			test('--- a/foo/bar', () => {
				deepStrictEqual(
					detectLinks('--- a/foo/bar', OperatingSystem.Linux),
					[
						{
							path: {
								index: 6,
								text: 'foo/bar'
							},
							prefix: undefined,
							suffix: undefined
						}
					] as IParsedLink[]
				);
			});
			test('+++ b/foo/bar', () => {
				deepStrictEqual(
					detectLinks('+++ b/foo/bar', OperatingSystem.Linux),
					[
						{
							path: {
								index: 6,
								text: 'foo/bar'
							},
							prefix: undefined,
							suffix: undefined
						}
					] as IParsedLink[]
				);
			});
			test('diff --git a/foo/bar b/foo/baz', () => {
				deepStrictEqual(
					detectLinks('diff --git a/foo/bar b/foo/baz', OperatingSystem.Linux),
					[
						{
							path: {
								index: 13,
								text: 'foo/bar'
							},
							prefix: undefined,
							suffix: undefined
						},
						{
							path: {
								index: 23,
								text: 'foo/baz'
							},
							prefix: undefined,
							suffix: undefined
						}
					] as IParsedLink[]
				);
			});
		});

		suite('should detect 3 suffix links on a single line', () => {
			for (let i = 0; i < testLinksWithSuffix.length - 2; i++) {
				const link1 = testLinksWithSuffix[i];
				const link2 = testLinksWithSuffix[i + 1];
				const link3 = testLinksWithSuffix[i + 2];
				const line = ` ${link1.link} ${link2.link} ${link3.link} `;
				test('`' + line + '`', () => {
					strictEqual(detectLinks(line, OperatingSystem.Linux).length, 3);
					ok(link1.suffix);
					ok(link2.suffix);
					ok(link3.suffix);
					const detectedLink1: IParsedLink = {
						prefix: link1.prefix ? {
							index: 1,
							text: link1.prefix
						} : undefined,
						path: {
							index: 1 + (link1.prefix?.length ?? 0),
							text: link1.link.replace(link1.suffix, '').replace(link1.prefix || '', '')
						},
						suffix: {
							row: link1.hasRow ? testRow : undefined,
							col: link1.hasCol ? testCol : undefined,
							suffix: {
								index: 1 + (link1.link.length - link1.suffix.length),
								text: link1.suffix
							}
						}
					};
					const detectedLink2: IParsedLink = {
						prefix: link2.prefix ? {
							index: (detectedLink1.prefix?.index ?? detectedLink1.path.index) + link1.link.length + 1,
							text: link2.prefix
						} : undefined,
						path: {
							index: (detectedLink1.prefix?.index ?? detectedLink1.path.index) + link1.link.length + 1 + (link2.prefix ?? '').length,
							text: link2.link.replace(link2.suffix, '').replace(link2.prefix ?? '', '')
						},
						suffix: {
							row: link2.hasRow ? testRow : undefined,
							col: link2.hasCol ? testCol : undefined,
							suffix: {
								index: (detectedLink1.prefix?.index ?? detectedLink1.path.index) + link1.link.length + 1 + (link2.link.length - link2.suffix.length),
								text: link2.suffix
							}
						}
					};
					const detectedLink3: IParsedLink = {
						prefix: link3.prefix ? {
							index: (detectedLink2.prefix?.index ?? detectedLink2.path.index) + link2.link.length + 1,
							text: link3.prefix
						} : undefined,
						path: {
							index: (detectedLink2.prefix?.index ?? detectedLink2.path.index) + link2.link.length + 1 + (link3.prefix ?? '').length,
							text: link3.link.replace(link3.suffix, '').replace(link3.prefix ?? '', '')
						},
						suffix: {
							row: link3.hasRow ? testRow : undefined,
							col: link3.hasCol ? testCol : undefined,
							suffix: {
								index: (detectedLink2.prefix?.index ?? detectedLink2.path.index) + link2.link.length + 1 + (link3.link.length - link3.suffix.length),
								text: link3.suffix
							}
						}
					};
					deepStrictEqual(
						detectLinks(line, OperatingSystem.Linux),
						[detectedLink1, detectedLink2, detectedLink3]
					);
				});
			}
		});
	});
});
