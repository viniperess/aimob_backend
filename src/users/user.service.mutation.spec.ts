import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('UsersService Mutation Tests', () => {
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

  it('should fail if bcrypt.hash is not called correctly', async () => {
    prisma.user.findUnique = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce('testpass');

    await expect(
      service.create({
        email: 'test@example.com',
        user: 'testuser',
        password: 'testpass',
      }),
    ).rejects.toThrow('Error during password hashing');
  });

  it('should fail if user is created without checking existing user', async () => {
    prisma.user.findUnique = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 1, user: 'existinguser' });

    await expect(
      service.create({
        email: 'existinguser@example.com',
        user: 'existinguser',
        password: 'testpass',
      }),
    ).rejects.toThrow('User already exists.');
  });
  it('should fail if user is created without checking existing user', async () => {
    jest
      .spyOn(prisma.user, 'findUnique')
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(
        () =>
          ({
            id: 1,
            user: 'existinguser',
            name: 'Existing User',
            email: 'existinguser@example.com',
            password: 'hashedpassword',
            cpf: '12345678900',
            city: 'CityName',
            phone: '123456789',
            creci: '12345',
            realEstates: [],
            appointments: [],
            tasks: [],
          } as any),
      );

    try {
      const result = await service.create({
        email: 'existinguser@example.com',
        user: 'existinguser',
        password: 'testpass',
      });

      expect(result).toBeUndefined();
    } catch (error) {
      expect(error.message).not.toBe('User already exists.');
    }
  });
});
