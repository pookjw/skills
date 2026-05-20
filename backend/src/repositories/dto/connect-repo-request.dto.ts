import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

function normalizeRepositoryInput(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  const sshMatch = trimmed.match(/^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/i);
  if (sshMatch) {
    return `${sshMatch[1]}/${sshMatch[2]}`;
  }

  const urlValue = trimmed.startsWith('github.com/')
    ? `https://${trimmed}`
    : trimmed;

  try {
    const parsed = new URL(urlValue);
    if (parsed.hostname.toLowerCase() !== 'github.com') {
      return trimmed;
    }

    const [owner, repo] = parsed.pathname
      .replace(/^\/+|\/+$/g, '')
      .split('/');

    if (!owner || !repo) {
      return trimmed;
    }

    return `${owner}/${repo.replace(/\.git$/i, '')}`;
  } catch {
    return trimmed;
  }
}

export class ConnectRepositoryRequestDto {
  @ApiProperty({
    example: 'swiftlang/swift',
    description: 'Repository in owner/repo format, or a GitHub repository URL.',
  })
  @Transform(({ value }) => normalizeRepositoryInput(value))
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  @Matches(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/, {
    message: 'fullName must be owner/repo or a GitHub repository URL',
  })
  fullName: string;
}
