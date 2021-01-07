import { IgnoreFile } from '..';
import { synthSnapshot, TestProject } from './util';

test('ignorefile synthesises correctly', () => {
  // GIVEN
  const prj = new TestProject();

  // WHEN
  new IgnoreFile(prj, '.dockerignore');

  // THEN
  expect(splitAndIgnoreMarker(synthSnapshot(prj)['.dockerignore'])).toEqual([]);
});

test('ignorefile puts includes (!) after excludes and sorts the entries', () => {
  // GIVEN
  const prj = new TestProject();

  // WHEN
  const file = new IgnoreFile(prj, '.dockerignore');
  file.include('c.txt', 'd.txt');
  file.exclude('a.txt', 'b.txt');
  file.exclude('e.txt', 'f.txt');

  // THEN
  expect(splitAndIgnoreMarker(synthSnapshot(prj)['.dockerignore'])).toEqual([
    'a.txt',
    'b.txt',
    'e.txt',
    'f.txt',
    '!c.txt',
    '!d.txt',
  ]);
});

test('ignorefile includes file after exclusion and inclusion', () => {
  // GIVEN
  const prj = new TestProject();

  // WHEN
  const file = new IgnoreFile(prj, '.dockerignore');
  file.exclude('a.txt');
  file.include('a.txt');

  // THEN
  expect(splitAndIgnoreMarker(synthSnapshot(prj)['.dockerignore'])).toEqual([
    '!a.txt',
  ]);
});

test('ignorefile excludes file after inclusion and exclusion', () => {
  // GIVEN
  const prj = new TestProject();

  // WHEN
  const file = new IgnoreFile(prj, '.dockerignore');
  file.include('a.txt');
  file.exclude('a.txt');

  // THEN
  expect(splitAndIgnoreMarker(synthSnapshot(prj)['.dockerignore'])).toEqual([
    '!a.txt',
  ]);
});

test('ignorefile omits duplicated includes and excludes', () => {
  // GIVEN
  const prj = new TestProject();

  // WHEN
  const file = new IgnoreFile(prj, '.dockerignore');
  file.exclude('a.txt', 'b.txt');
  file.include('c.txt', 'd.txt');
  file.exclude('a.txt', 'b.txt');
  file.include('c.txt', 'd.txt');

  // THEN
  expect(splitAndIgnoreMarker(synthSnapshot(prj)['.dockerignore'])).toEqual([
    'a.txt',
    'b.txt',
    '!c.txt',
    '!d.txt',
  ]);
});

test('includes (!) are always at the end', () => {
  // GIVEN
  const prj = new TestProject();
  const ignore = new IgnoreFile(prj, '.myignorefile');

  // WHEN
  ignore.addPatterns('*.foo');
  ignore.addPatterns('!hello.foo');
  ignore.include('negated.txt');
  ignore.addPatterns('*.bar');
  ignore.exclude('*.bar');
  ignore.include('zoo.foo');
  ignore.addPatterns('!negated.txt');

  // THEN
  expect(splitAndIgnoreMarker(synthSnapshot(prj)['.myignorefile'])).toStrictEqual([
    '*.bar',
    '*.foo',
    '!hello.foo',
    '!negated.txt',
    '!zoo.foo',
  ]);
});

test('if include() is called with "!", then strip it', () => {
  // GIVEN
  const prj = new TestProject();
  const ignore = new IgnoreFile(prj, '.myignorefile');

  // WHEN
  ignore.include('!*.js');

  // THEN
  expect(splitAndIgnoreMarker(synthSnapshot(prj)['.myignorefile'])).toStrictEqual([
    '!*.js',
  ]);
});

test('removePatters() can be used to remove previously added patters', () => {
  // GIVEN
  const prj = new TestProject();
  const ignore = new IgnoreFile(prj, '.myignorefile');

  // WHEN
  ignore.addPatterns('*.js');
  ignore.addPatterns('my_file');
  ignore.addPatterns('!boom/bam');
  ignore.removePatterns('*.zz', '*.js', '!boom/bam');
  ignore.addPatterns('*.zz');
  ignore.addPatterns('boom/bam');

  // THEN
  expect(splitAndIgnoreMarker(synthSnapshot(prj)['.myignorefile'])).toStrictEqual([
    '*.zz',
    'boom/bam',
    'my_file',
  ]);
});

test('comments are filtered out', () => {
  // GIVEN
  const prj = new TestProject();
  const ignore = new IgnoreFile(prj, '.myignorefile');

  // WHEN
  ignore.addPatterns('*.js', '#comment');
  ignore.addPatterns('!foo');
  ignore.addPatterns('# hello world');
  ignore.addPatterns('bar');

  // THEN
  expect(splitAndIgnoreMarker(synthSnapshot(prj)['.myignorefile'])).toStrictEqual([
    '*.js',
    'bar',
    '!foo',
  ]);
});

// parses file contents without 'Generated by...' spiel
function splitAndIgnoreMarker(fileContents: string) {
  return fileContents.split('\n').slice(1);
}
