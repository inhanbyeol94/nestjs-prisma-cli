# setup
1. NestJS 프로젝트에서 `/src/_common/_utils` 폴더 경로를 의존합니다.
2. `/src/config.ts` 파일을 의존합니다.
    ```ts
    export class Config {
        ...
        static readonly APP_DATA_PROCESSING_EXPOSE = ["deletedAt", ...] as const;
        ...
    }
    ```
3. `/prisma/schema/models` 내부에 스키마들이 배치되어 있어야합니다.
    - prisma 버전은 5.15.0 버전 이상 사용해야하며, `prismaSchemaFolder` previewFeatures를 적용해야합니다.
    - 스키마 파일당 하나의 모델이 정의되어 있어야합니다.<br>
      _타입에 지정된 Enum 또한 별도의 `.prisma` 파일을 생성하여 관리 필수_
    - 아래의 기준을 모두 적합한 상태로 작성해야하며 예시를 참고해주세요
        - *모델 설명
        - *모델명
        - *필드명
        - *필드타입
        - *필드설명 (주석)
       ```prisma
       // 손님
        model Guest {
        id        Int       @id @default(autoincrement()) // 게스트 아이디
        name      String    @db.VarChar() // 이름
        password  String?   @db.VarChar() // 비밀번호
        createdAt DateTime  @default(now()) @map("created_at") @db.Timestamp(3) // 생성일
        deletedAt DateTime? @map("deleted_at") @db.Timestamp(3) // 삭제일
        post      Post?     @relation(fields: [postId], references: [id]) // 작성한 게시물
        postId    Int?      @unique @map("post_id") // 작성한 게시물 아이디
        }
       ```
   
# command
라이브러리 설치 후 실행할 수 있는 명령어는 다음과 같습니다.

### `npc generate model` or `npc g model`
- `src/_common/_utils/models` 폴더에 스웨거에서 반환타입으로 사용할 수 있는 **Response Model**을 생성합니다.