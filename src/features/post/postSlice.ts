import axios from "axios";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { RootState } from "../../app/store";
import { PROPS_COMMENT, PROPS_LIKED, PROPS_NEWPOST } from "../types";

// top階層の.envで環境変数を設定。
// REACT_APP_ で定義したものを環境変数として使用できる。
const apiUrlPost = `${process.env.REACT_APP_LARAVEL_API_URL}/api/post`;
const apiUrlComment = `${process.env.REACT_APP_LARAVEL_API_URL}/api/comment`;

// 非同期関数
// ※非同期関数はcreateSlice()の外に書く。
// createAsyncThunk
// https://redux-toolkit.js.org/api/createAsyncThunk

// 投稿一覧取得
export const fetchAsyncGetPosts = createAsyncThunk("post/get", async () => {
  const res = await axios.get(apiUrlPost, {
    headers: {
      Authorization: `JWT ${localStorage.localJWT}`,
    },
  });
  return res.data;
});

// 投稿作成
export const fetchAsyncNewPost = createAsyncThunk(
  "post/post",
  async (newPost: PROPS_NEWPOST) => {
    /**
     * FormData()
     * サーバーにデータを送信する際に使用するbuilt-inコンストラクタ。下記2とおりの使い方がある。
     *   1. フォームの内容をキャプチャする
     *   2. 空の FormData インスタンスを作成して、それにデータを設定、変更する。
     * 今回は2の使い方。
     * インスタンス化したら append() メソッドを呼び出すことでフィールドを追加できる。
     */
    // uploadするデータの箱。
    const uploadData = new FormData();
    uploadData.append("title", newPost.title);
    /**
     * formData.append(name, blob, fileName)
     * フィールドを追加します。3つ目の引数 fileName はファイル名を設定します
     * (フィールド名ではありません)。ファイルシステムでのファイル名です。
     * 参照
     * https://ja.javascript.info/formdata
     */
    newPost.img && uploadData.append("img", newPost.img, newPost.img.name);
    // resには新規投稿のobjectデータが返ってくる。
    const res = await axios.post(apiUrlPost, uploadData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `JWT ${localStorage.localJWT}`,
      },
    });
    return res.data;
  }
);

// 投稿のいいねを更新
export const fetchAsyncPatchLiked = createAsyncThunk(
  "post/patch",
  async (liked: PROPS_LIKED) => {
    const currentLiked = liked.current;
    // uploadするデータの箱。
    const uploadData = new FormData();

    // すでにいいねしている場合、解除する。
    let isOverlapped = false;
    // 依存のid配列の要素にいいねしたuserのidがあるかcheck。
    currentLiked.forEach((current) => {
      if (current === liked.new) {
        isOverlapped = true;
      } else {
        uploadData.append("liked", String(current));
      }
    });

    // いいねしていない投稿にいいねした場合
    if (!isOverlapped) {
      uploadData.append("liked", String(liked.new));
      // すでにいいねしていて、そのいいねが自分なので、解除に合わせて空配列をputする場合。
    } else if (currentLiked.length === 1) {
      uploadData.append("title", liked.title);
      // uploadData => この分岐では空配列となる。
      const res = await axios.put(`${apiUrlPost}${liked.id}/`, uploadData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${localStorage.localJWT}`,
        },
      });
      // 以降の処理はせず非同期関数を終了。
      return res.data;
    }
    // 新規いいねを加えた配列 or 解除したいいね以外のいいね配列 をputする。
    const res = await axios.patch(`${apiUrlPost}${liked.id}/`, uploadData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `JWT ${localStorage.localJWT}`,
      },
    });
    return res.data;
  }
);

// コメント一覧取得
export const fetchAsyncGetComments = createAsyncThunk(
  "comment/get",
  async () => {
    const res = await axios.get(apiUrlComment, {
      headers: {
        Authorization: `JWT ${localStorage.localJWT}`,
      },
    });
    return res.data;
  }
);

// コメント作成
export const fetchAsyncPostComment = createAsyncThunk(
  "comment/post",
  async (comment: PROPS_COMMENT) => {
    const res = await axios.post(apiUrlComment, comment, {
      headers: {
        Authorization: `JWT ${localStorage.localJWT}`,
      },
    });
    return res.data;
  }
);

// createSlice
// https://redux-toolkit.js.org/api/createSlice
export const postSlice = createSlice({
  name: "post",
  initialState: {
    // 投稿やコメントの進行状態
    isLoadingPost: false,
    // 投稿modalの状態
    openNewPost: false,
    // 投稿
    posts: [
      {
        id: 0,
        title: "",
        userPost: 0,
        created_at: "",
        img: "",
        liked: [0],
      },
    ],
    // コメント
    comments: [
      {
        id: 0,
        text: "",
        userComment: 0,
        post: 0,
      },
    ],
  },
  // reducers
  // https://redux-toolkit.js.org/api/createSlice#reducers
  reducers: {
    // 各reducerの引数は、stateのみ、またはstateとaction両方を持つことができる。
    fetchPostStart(state) {
      state.isLoadingPost = true;
    },
    fetchPostEnd(state) {
      state.isLoadingPost = false;
    },
    setOpenNewPost(state) {
      state.openNewPost = true;
    },
    resetOpenNewPost(state) {
      state.openNewPost = false;
    },
  },
  // extraReducers
  // https://redux-toolkit.js.org/api/createSlice#extrareducers
  // 上記createAsyncThunkで定義した非同期処理の後続処理をreducerに組み込む。
  extraReducers: (builder) => {
    // builder.addCase
    // https://redux-toolkit.js.org/api/createReducer#builderaddcase
    builder.addCase(fetchAsyncGetPosts.fulfilled, (state, action) => {
      // action.payload => createAsyncThunk()の2nd paramである非同期関数の返り値。
      return {
        ...state,
        posts: action.payload,
      };
    });
    builder.addCase(fetchAsyncNewPost.fulfilled, (state, action) => {
      return {
        ...state,
        posts: [...state.posts, action.payload],
      };
    });
    builder.addCase(fetchAsyncGetComments.fulfilled, (state, action) => {
      return {
        ...state,
        comments: action.payload,
      };
    });
    builder.addCase(fetchAsyncPostComment.fulfilled, (state, action) => {
      return {
        ...state,
        comments: [...state.comments, action.payload],
      };
    });
    builder.addCase(fetchAsyncPatchLiked.fulfilled, (state, action) => {
      return {
        ...state,
        posts: state.posts.map((post) =>
          post.id === action.payload.id ? action.payload : post
        ),
      };
    });
  },
});

// reducersをexport。
export const {
  fetchPostStart,
  fetchPostEnd,
  setOpenNewPost,
  resetOpenNewPost,
} = postSlice.actions;

// useSelectorでアクセスできるよう定義。
// RootState => storeのすべてのsliceを含んだ型
// post => src/app/store.tsのconfigureStore()で定義した名前
export const selectIsLoadingPost = (state: RootState) =>
  state.post.isLoadingPost;
export const selectOpenNewPost = (state: RootState) => state.post.openNewPost;
export const selectPosts = (state: RootState) => state.post.posts;
export const selectComments = (state: RootState) => state.post.comments;

export default postSlice.reducer;
