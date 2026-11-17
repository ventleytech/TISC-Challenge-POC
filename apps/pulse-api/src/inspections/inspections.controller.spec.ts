import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InspectionsController } from './inspections.controller';
import { MemoryStore } from '../domain/memory.store';

describe('InspectionsController', () => {
  let controller: InspectionsController;
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore();
    controller = new InspectionsController(store);
  });

  it('creates and lists by utility_id', () => {
    const utilityId = '00000000-0000-4000-8000-000000000001';
    const { id } = controller.create({ utility_id: utilityId });
    expect(id).toBeTruthy();
    const listed = controller.list(utilityId);
    expect(listed.items).toHaveLength(1);
    expect(listed.items[0].status).toBe('planned');
    expect(controller.getOne(id).id).toBe(id);
  });

  it('requires utility_id on list', () => {
    expect(() => controller.list(undefined)).toThrow(BadRequestException);
  });

  it('404s unknown id', () => {
    expect(() =>
      controller.getOne('00000000-0000-4000-8000-000000000099'),
    ).toThrow(NotFoundException);
  });
});
