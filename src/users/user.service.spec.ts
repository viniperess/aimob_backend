import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaClient,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaClient>(PrismaClient);
  });

  it('should throw an error if email already exists', async () => {
    prisma.user.findUnique = jest
      .fn()
      .mockResolvedValueOnce({ id: 1, email: 'test@example.com' });

    await expect(
      service.create({
        email: 'test@example.com',
        user: 'testuser',
        password: 'testpass',
      }),
    ).rejects.toThrow('Email already exists.');
  });

  it('should throw an error if user already exists', async () => {
    prisma.user.findUnique = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 1, user: 'testuser' });

    await expect(
      service.create({
        email: 'test2@example.com',
        user: 'testuser',
        password: 'testpass',
      }),
    ).rejects.toThrow('User already exists.');
  });

  it('should create a new user', async () => {
    prisma.user.findUnique = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    prisma.user.create = jest.fn().mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      user: 'testuser',
      password: 'hashedpassword',
    });

    const bcryptHashSpy = jest
      .spyOn(bcrypt, 'hash')
      .mockResolvedValueOnce('hashedpassword');

    const result = await service.create({
      email: 'test@example.com',
      user: 'testuser',
      password: 'testpass',
    });

    expect(result).toEqual({
      id: 1,
      email: 'test@example.com',
      user: 'testuser',
      password: 'hashedpassword',
    });

    expect(bcryptHashSpy).toHaveBeenCalledWith('testpass', 10);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'test@example.com',
        user: 'testuser',
        password: 'hashedpassword',
      },
    });
  });
});
