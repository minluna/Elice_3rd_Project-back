import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Post } from './post.entity';

@Index('postId', ['postId'], {})
@Entity('post_image')
export class PostImage {
  @PrimaryGeneratedColumn({
    type: 'int',
    name: 'imageId',
    comment: '게시물 이미지의 ID',
  })
  imageId: number;

  @Column({ type: 'int', name: 'postId' })
  postId: number;

  @Column({ type: 'varchar', name: 'imageUrl', comment: '게시물 이미지의 URL주소' })
  imageUrl: string;

  @ManyToOne(() => Post, (post) => post.postImage, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn([{ name: 'postId', referencedColumnName: 'id' }])
  post: Post;
}
